package br.com.nucleo.api.family.dto;

import br.com.nucleo.api.family.domain.FamilyRole;
import br.com.nucleo.api.family.domain.InvitationStatus;

import java.time.Instant;
import java.util.UUID;

public record InvitationResponse(
        UUID id,
        String email,
        FamilyRole role,
        InvitationStatus status,
        Instant expiresAt,
        Instant respondedAt,
        Instant createdAt,
        InvitedBy invitedBy
) {

    public record InvitedBy(
            UUID id,
            String name
    ) {
    }
}