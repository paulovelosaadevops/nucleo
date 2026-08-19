package br.com.nucleo.api.auth;

import java.util.UUID;

import br.com.nucleo.api.family.FamilyRole;

public record RegisterResponse(
        UUID userId,
        UUID familyId,
        String name,
        String email,
        String familyName,
        FamilyRole role
) {
}