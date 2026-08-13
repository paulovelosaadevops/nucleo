package br.com.nucleo.api.families.dto;

import java.time.Instant;
import java.util.UUID;

import br.com.nucleo.api.families.FamilyInvitation;
import br.com.nucleo.api.families.FamilyInvitationStatus;
import br.com.nucleo.api.families.FamilyRole;

public record FamilyInvitationResponse(
        UUID id,
        String invitedEmail,
        FamilyRole role,
        FamilyInvitationStatus status,
        Instant createdAt
) {

    public static FamilyInvitationResponse from(FamilyInvitation invitation) {
        return new FamilyInvitationResponse(
                invitation.getId(),
                invitation.getInvitedEmail(),
                invitation.getRole(),
                invitation.getStatus(),
                invitation.getCreatedAt()
        );
    }
}