package br.com.nucleo.api.identity.profile.dto;

import br.com.nucleo.api.family.domain.Family;

import java.time.Instant;
import java.util.UUID;

import br.com.nucleo.api.family.domain.FamilyRole;
import br.com.nucleo.api.identity.user.domain.UserStatus;

public record CurrentUserResponse(
        UUID id,
        String name,
        String email,
        UserStatus status,
        boolean emailVerified,
        Family family
) {

    public record Family(
            UUID id,
            String name,
            FamilyRole role,
            Instant joinedAt
    ) {
    }
}