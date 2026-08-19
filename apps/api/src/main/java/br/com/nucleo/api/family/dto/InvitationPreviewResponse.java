package br.com.nucleo.api.family.dto;

import br.com.nucleo.api.family.domain.FamilyRole;
import br.com.nucleo.api.family.domain.InvitationStatus;

import java.time.Instant;
import java.util.UUID;

public record InvitationPreviewResponse(
        UUID invitationId,
        String familyName,
        String maskedEmail,
        FamilyRole role,
        InvitationStatus status,
        String invitedByName,
        Instant expiresAt
) {
}