package br.com.nucleo.api.family.service;

import br.com.nucleo.api.common.error.InvitationConflictException;
import br.com.nucleo.api.common.error.ResourceNotFoundException;
import br.com.nucleo.api.family.domain.FamilyInvitation;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.domain.FamilyRole;
import br.com.nucleo.api.family.domain.InvitationStatus;
import br.com.nucleo.api.family.dto.CreateInvitationRequest;
import br.com.nucleo.api.family.dto.FamilyMemberResponse;
import br.com.nucleo.api.family.dto.InvitationCreatedResponse;
import br.com.nucleo.api.family.dto.InvitationPreviewResponse;
import br.com.nucleo.api.family.dto.InvitationResponse;
import br.com.nucleo.api.family.repository.FamilyInvitationRepository;
import br.com.nucleo.api.family.repository.FamilyMembershipRepository;
import br.com.nucleo.api.identity.user.domain.User;
import br.com.nucleo.api.identity.user.repository.UserRepository;
import br.com.nucleo.api.notification.domain.NotificationType;
import br.com.nucleo.api.notification.service.NotificationService;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FamilyManagementService {

    private final FamilyAccessService familyAccessService;
    private final FamilyMembershipRepository membershipRepository;
    private final FamilyInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final InvitationTokenService invitationTokenService;
    private final NotificationService notificationService;
    private final String webUrl;
    private final Duration invitationTtl;

    public FamilyManagementService(
            FamilyAccessService familyAccessService,
            FamilyMembershipRepository membershipRepository,
            FamilyInvitationRepository invitationRepository,
            UserRepository userRepository,
            InvitationTokenService invitationTokenService,
            NotificationService notificationService,
            @Value("${app.web-url}") String webUrl,
            @Value("${app.invitations.ttl}") Duration invitationTtl
    ) {
        this.familyAccessService = familyAccessService;
        this.membershipRepository = membershipRepository;
        this.invitationRepository = invitationRepository;
        this.userRepository = userRepository;
        this.invitationTokenService = invitationTokenService;
        this.notificationService = notificationService;
        this.webUrl = webUrl.replaceAll("/+$", "");
        this.invitationTtl = invitationTtl;
    }

    @Transactional(readOnly = true)
    public List<FamilyMemberResponse> listMembers(
            UUID currentUserId
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        return membershipRepository
                .findAllByFamily_IdOrderByJoinedAtAsc(
                        currentMembership.getFamily().getId()
                )
                .stream()
                .map(membership ->
                        new FamilyMemberResponse(
                                membership.getId(),
                                membership.getUser().getId(),
                                membership.getUser().getName(),
                                membership.getUser().getEmail(),
                                membership.getRole(),
                                membership.getStatus(),
                                membership.getJoinedAt(),
                                membership.getUser()
                                        .getId()
                                        .equals(currentUserId)
                        )
                )
                .toList();
    }

    @Transactional
    public InvitationCreatedResponse createInvitation(
            UUID currentUserId,
            CreateInvitationRequest request
    ) {
        FamilyMembership administrator =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        if (request.role() == FamilyRole.OWNER) {
            throw new InvitationConflictException(
                    "O papel OWNER não pode ser atribuído por convite"
            );
        }

        String email = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        ensureUserIsNotAlreadyMember(email);

        ensurePendingInvitationDoesNotExist(
                administrator.getFamily().getId(),
                email
        );

        String rawToken = invitationTokenService.generate();

        FamilyInvitation invitation = FamilyInvitation.create(
                administrator.getFamily(),
                email,
                request.role(),
                invitationTokenService.hash(rawToken),
                administrator.getUser(),
                Instant.now().plus(invitationTtl)
        );

        try {
            invitationRepository.saveAndFlush(invitation);
        } catch (DataIntegrityViolationException exception) {
            throw new InvitationConflictException(
                    "Já existe um convite pendente para este e-mail"
            );
        }

        notificationService.notifyActiveFamilyMembers(
                administrator.getFamily(),
                administrator.getUser().getId(),
                NotificationType.FAMILY_INVITATION,
                "Novo convite familiar",
                administrator.getUser().getName()
                        + " convidou "
                        + email
                        + " para participar do núcleo.",
                "/familia/convites",
                invitation.getId(),
                "family-invitation-created:"
                        + invitation.getId()
        );

        return new InvitationCreatedResponse(
                toResponse(invitation),
                rawToken,
                webUrl + "/convites/" + rawToken
        );
    }

    @Transactional
    public List<InvitationResponse> listInvitations(
            UUID currentUserId
    ) {
        FamilyMembership administrator =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        Instant now = Instant.now();

        return invitationRepository
                .findAllByFamily_IdOrderByCreatedAtDesc(
                        administrator.getFamily().getId()
                )
                .stream()
                .peek(invitation ->
                        invitation.expireIfNecessary(now)
                )
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void revokeInvitation(
            UUID currentUserId,
            UUID invitationId
    ) {
        FamilyMembership administrator =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        FamilyInvitation invitation = invitationRepository
                .findByIdAndFamily_Id(
                        invitationId,
                        administrator.getFamily().getId()
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Convite não encontrado"
                        )
                );

        if (!invitation.isPending()) {
            throw new InvitationConflictException(
                    "Este convite não está mais pendente"
            );
        }

        if (invitation.isExpired()) {
            invitation.expireIfNecessary(Instant.now());

            throw new InvitationConflictException(
                    "Este convite já expirou"
            );
        }

        invitation.revoke();
    }

    @Transactional
    public InvitationPreviewResponse previewInvitation(
            String rawToken
    ) {
        FamilyInvitation invitation = invitationRepository
                .findByTokenHash(
                        invitationTokenService.hash(rawToken)
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Convite não encontrado"
                        )
                );

        invitation.expireIfNecessary(Instant.now());

        return new InvitationPreviewResponse(
                invitation.getId(),
                invitation.getFamily().getName(),
                maskEmail(invitation.getEmail()),
                invitation.getRole(),
                invitation.getStatus(),
                invitation.getInvitedBy().getName(),
                invitation.getExpiresAt()
        );
    }

    private void ensureUserIsNotAlreadyMember(
            String email
    ) {
        userRepository
                .findByEmailIgnoreCase(email)
                .map(User::getId)
                .filter(membershipRepository::existsByUser_Id)
                .ifPresent(userId -> {
                    throw new InvitationConflictException(
                            "Este usuário já pertence a um núcleo familiar"
                    );
                });
    }

    private void ensurePendingInvitationDoesNotExist(
            UUID familyId,
            String email
    ) {
        boolean exists = invitationRepository
                .existsByFamily_IdAndEmailIgnoreCaseAndStatus(
                        familyId,
                        email,
                        InvitationStatus.PENDING
                );

        if (exists) {
            throw new InvitationConflictException(
                    "Já existe um convite pendente para este e-mail"
            );
        }
    }

    private InvitationResponse toResponse(
            FamilyInvitation invitation
    ) {
        return new InvitationResponse(
                invitation.getId(),
                invitation.getEmail(),
                invitation.getRole(),
                invitation.getStatus(),
                invitation.getExpiresAt(),
                invitation.getRespondedAt(),
                invitation.getCreatedAt(),
                new InvitationResponse.InvitedBy(
                        invitation.getInvitedBy().getId(),
                        invitation.getInvitedBy().getName()
                )
        );
    }

    private String maskEmail(String email) {
        int separator = email.indexOf('@');

        if (separator <= 1) {
            return "***" + email.substring(separator);
        }

        return email.charAt(0)
                + "***"
                + email.substring(separator);
    }
}