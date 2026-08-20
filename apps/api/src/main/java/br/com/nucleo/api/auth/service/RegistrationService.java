package br.com.nucleo.api.auth.service;

import br.com.nucleo.api.auth.dto.RegisterRequest;
import br.com.nucleo.api.auth.dto.RegisterResponse;
import br.com.nucleo.api.common.error.EmailAlreadyInUseException;
import br.com.nucleo.api.common.error.InvitationConflictException;
import br.com.nucleo.api.common.error.ResourceNotFoundException;
import br.com.nucleo.api.family.domain.Family;
import br.com.nucleo.api.family.domain.FamilyInvitation;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.repository.FamilyInvitationRepository;
import br.com.nucleo.api.family.repository.FamilyMembershipRepository;
import br.com.nucleo.api.family.repository.FamilyRepository;
import br.com.nucleo.api.family.service.InvitationTokenService;
import br.com.nucleo.api.identity.user.domain.User;
import br.com.nucleo.api.identity.user.repository.UserRepository;
import br.com.nucleo.api.notification.domain.NotificationType;
import br.com.nucleo.api.notification.service.NotificationService;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegistrationService {

    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;
    private final FamilyMembershipRepository membershipRepository;
    private final FamilyInvitationRepository invitationRepository;
    private final InvitationTokenService invitationTokenService;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    public RegistrationService(
            UserRepository userRepository,
            FamilyRepository familyRepository,
            FamilyMembershipRepository membershipRepository,
            FamilyInvitationRepository invitationRepository,
            InvitationTokenService invitationTokenService,
            PasswordEncoder passwordEncoder,
            NotificationService notificationService
    ) {
        this.userRepository = userRepository;
        this.familyRepository = familyRepository;
        this.membershipRepository = membershipRepository;
        this.invitationRepository = invitationRepository;
        this.invitationTokenService = invitationTokenService;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
    }

    @Transactional
    public RegisterResponse register(
            RegisterRequest request
    ) {
        String normalizedEmail = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (
                userRepository.existsByEmailIgnoreCase(
                        normalizedEmail
                )
        ) {
            throw new EmailAlreadyInUseException();
        }

        try {
            if (hasInvitation(request)) {
                return registerFromInvitation(
                        request,
                        normalizedEmail
                );
            }

            return registerWithNewFamily(
                    request,
                    normalizedEmail
            );
        } catch (DataIntegrityViolationException exception) {
            if (
                    userRepository.existsByEmailIgnoreCase(
                            normalizedEmail
                    )
            ) {
                throw new EmailAlreadyInUseException();
            }

            throw exception;
        }
    }

    private RegisterResponse registerWithNewFamily(
            RegisterRequest request,
            String normalizedEmail
    ) {
        User user = createUser(
                request,
                normalizedEmail
        );

        Family family = Family.create(
                request.familyName(),
                user
        );

        familyRepository.save(family);

        FamilyMembership membership =
                FamilyMembership.createOwner(
                        family,
                        user
                );

        membershipRepository.save(membership);

        return toResponse(
                user,
                family,
                membership
        );
    }

    private RegisterResponse registerFromInvitation(
            RegisterRequest request,
            String normalizedEmail
    ) {
        String tokenHash = invitationTokenService.hash(
                request.invitationToken().trim()
        );

        FamilyInvitation invitation = invitationRepository
                .findByTokenHash(tokenHash)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Convite não encontrado"
                        )
                );

        validateInvitation(
                invitation,
                normalizedEmail
        );

        User user = createUser(
                request,
                normalizedEmail
        );

        FamilyMembership membership =
                FamilyMembership.createMember(
                        invitation.getFamily(),
                        user,
                        invitation.getRole()
                );

        membershipRepository.save(membership);
        invitation.accept();

        notificationService.notifyActiveFamilyMembers(
                invitation.getFamily(),
                user.getId(),
                NotificationType.FAMILY_MEMBER_JOINED,
                "Novo membro na família",
                user.getName()
                        + " entrou no núcleo familiar.",
                "/familia",
                membership.getId(),
                "family-member-joined:"
                        + membership.getId()
        );

        return toResponse(
                user,
                invitation.getFamily(),
                membership
        );
    }

    private User createUser(
            RegisterRequest request,
            String normalizedEmail
    ) {
        User user = User.create(
                request.name(),
                normalizedEmail,
                passwordEncoder.encode(
                        request.password()
                )
        );

        return userRepository.save(user);
    }

    private void validateInvitation(
            FamilyInvitation invitation,
            String normalizedEmail
    ) {
        if (!invitation.isPending()) {
            throw new InvitationConflictException(
                    "Este convite não está mais disponível"
            );
        }

        if (invitation.isExpired()) {
            throw new InvitationConflictException(
                    "Este convite expirou"
            );
        }

        if (!invitation.getEmail().equals(normalizedEmail)) {
            throw new InvitationConflictException(
                    "O e-mail informado não corresponde ao convite"
            );
        }
    }

    private RegisterResponse toResponse(
            User user,
            Family family,
            FamilyMembership membership
    ) {
        return new RegisterResponse(
                user.getId(),
                family.getId(),
                user.getName(),
                user.getEmail(),
                family.getName(),
                membership.getRole()
        );
    }

    private boolean hasInvitation(
            RegisterRequest request
    ) {
        return request.invitationToken() != null
                && !request.invitationToken().isBlank();
    }
}