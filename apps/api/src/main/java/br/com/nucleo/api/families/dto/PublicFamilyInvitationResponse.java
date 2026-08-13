package br.com.nucleo.api.families.dto;

import java.util.UUID;

import br.com.nucleo.api.families.FamilyInvitation;
import br.com.nucleo.api.families.FamilyInvitationStatus;
import br.com.nucleo.api.families.FamilyRole;

public record PublicFamilyInvitationResponse(
        UUID id,
        String familyName,
        String invitedEmail,
        FamilyRole role,
        FamilyInvitationStatus status
) {

    public static PublicFamilyInvitationResponse from(FamilyInvitation invitation) {
        return new PublicFamilyInvitationResponse(
                invitation.getId(),
                invitation.getFamily().getName(),
                invitation.getInvitedEmail(),
                invitation.getRole(),
                invitation.getStatus()
        );
    }
}