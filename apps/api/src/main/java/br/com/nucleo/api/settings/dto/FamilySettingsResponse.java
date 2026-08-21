package br.com.nucleo.api.settings.dto;

import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.domain.FamilyRole;
import br.com.nucleo.api.settings.domain.FamilySettings;
import br.com.nucleo.api.settings.domain.WeekStartDay;
import java.time.Instant;
import java.util.UUID;

public record FamilySettingsResponse(
        UUID id,
        UUID familyId,
        String familyName,
        String timeZone,
        String defaultCurrency,
        String locale,
        WeekStartDay weekStartDay,
        FamilyRole currentUserRole,
        boolean canManage,
        Instant createdAt,
        Instant updatedAt,
        long version
) {

    public static FamilySettingsResponse from(
            FamilySettings settings,
            FamilyMembership membership
    ) {
        FamilyRole role = membership.getRole();

        boolean canManage =
                role == FamilyRole.OWNER
                        || role == FamilyRole.ADMIN;

        return new FamilySettingsResponse(
                settings.getId(),
                settings.getFamily().getId(),
                settings.getFamily().getName(),
                settings.getFamily().getTimeZone(),
                settings.getDefaultCurrency(),
                settings.getLocale(),
                settings.getWeekStartDay(),
                role,
                canManage,
                settings.getCreatedAt(),
                settings.getUpdatedAt(),
                settings.getVersion()
        );
    }
}