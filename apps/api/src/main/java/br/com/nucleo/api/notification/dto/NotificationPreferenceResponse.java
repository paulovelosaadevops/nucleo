package br.com.nucleo.api.notification.dto;

import br.com.nucleo.api.notification.domain.NotificationPreference;
import java.time.Instant;
import java.util.UUID;

public record NotificationPreferenceResponse(
        UUID id,
        UUID familyId,
        UUID userId,
        boolean inAppEnabled,
        boolean familyEnabled,
        boolean agendaEnabled,
        boolean shoppingEnabled,
        boolean financeEnabled,
        Instant createdAt,
        Instant updatedAt
) {

    public static NotificationPreferenceResponse from(
            NotificationPreference preference
    ) {
        return new NotificationPreferenceResponse(
                preference.getId(),
                preference.getFamily().getId(),
                preference.getUser().getId(),
                preference.isInAppEnabled(),
                preference.isFamilyEnabled(),
                preference.isAgendaEnabled(),
                preference.isShoppingEnabled(),
                preference.isFinanceEnabled(),
                preference.getCreatedAt(),
                preference.getUpdatedAt()
        );
    }
}