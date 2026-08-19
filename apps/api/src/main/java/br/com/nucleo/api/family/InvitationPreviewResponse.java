package br.com.nucleo.api.family;

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