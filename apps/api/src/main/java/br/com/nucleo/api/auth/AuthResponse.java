package br.com.nucleo.api.auth;

import java.util.UUID;

import br.com.nucleo.api.family.FamilyRole;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        UserSummary user,
        FamilySummary family
) {

    public record UserSummary(
            UUID id,
            String name,
            String email
    ) {
    }

    public record FamilySummary(
            UUID id,
            String name,
            FamilyRole role
    ) {
    }
}