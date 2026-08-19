package br.com.nucleo.api.family.service;

import br.com.nucleo.api.family.domain.FamilyInvitation;
import br.com.nucleo.api.family.repository.FamilyInvitationRepository;

import br.com.nucleo.api.common.error.InvitationConflictException;
import br.com.nucleo.api.common.error.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvitationDecisionService {

    private final FamilyInvitationRepository invitationRepository;
    private final InvitationTokenService invitationTokenService;

    public InvitationDecisionService(
            FamilyInvitationRepository invitationRepository,
            InvitationTokenService invitationTokenService
    ) {
        this.invitationRepository = invitationRepository;
        this.invitationTokenService = invitationTokenService;
    }

    @Transactional
    public void decline(String rawToken) {
        FamilyInvitation invitation = invitationRepository
                .findByTokenHash(
                        invitationTokenService.hash(rawToken)
                )
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Convite não encontrado"
                ));

        if (!invitation.isPending()) {
            throw new InvitationConflictException(
                    "Este convite não está mais pendente"
            );
        }

        if (invitation.isExpired()) {
            throw new InvitationConflictException(
                    "Este convite expirou"
            );
        }

        invitation.decline();
    }
}