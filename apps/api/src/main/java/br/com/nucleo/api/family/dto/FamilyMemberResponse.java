package br.com.nucleo.api.family.dto;

import br.com.nucleo.api.family.domain.FamilyRole;
import br.com.nucleo.api.family.domain.MembershipStatus;

import java.time.Instant;
import java.util.UUID;

public record FamilyMemberResponse(
        UUID membershipId,
        UUID userId,
        String name,
        String email,
        FamilyRole role,
        MembershipStatus status,
        Instant joinedAt,
        boolean currentUser
) {
}