package br.com.nucleo.api.auth.dto;

import java.util.UUID;

import br.com.nucleo.api.family.domain.FamilyRole;

public record RegisterResponse(
        UUID userId,
        UUID familyId,
        String name,
        String email,
        String familyName,
        FamilyRole role
) {
}