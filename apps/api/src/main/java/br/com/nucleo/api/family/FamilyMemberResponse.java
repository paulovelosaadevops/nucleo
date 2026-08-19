package br.com.nucleo.api.family;

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