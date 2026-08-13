package br.com.nucleo.api.families.dto;

import java.time.Instant;
import java.util.UUID;

import br.com.nucleo.api.families.FamilyMembership;
import br.com.nucleo.api.families.FamilyRole;

public record FamilyMemberResponse(
        UUID id,
        UUID userId,
        String name,
        String email,
        FamilyRole role,
        Instant createdAt
) {

    public static FamilyMemberResponse from(FamilyMembership membership) {
        return new FamilyMemberResponse(
                membership.getId(),
                membership.getUser().getId(),
                membership.getUser().getName(),
                membership.getUser().getEmail(),
                membership.getRole(),
                membership.getCreatedAt()
        );
    }
}
