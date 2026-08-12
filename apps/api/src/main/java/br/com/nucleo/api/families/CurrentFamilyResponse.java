package br.com.nucleo.api.families;

import java.util.UUID;

public record CurrentFamilyResponse(
        UUID id,
        String name,
        FamilyRole role
) {

    public static CurrentFamilyResponse from(FamilyMembership membership) {
        return new CurrentFamilyResponse(
                membership.getFamily().getId(),
                membership.getFamily().getName(),
                membership.getRole()
        );
    }
}