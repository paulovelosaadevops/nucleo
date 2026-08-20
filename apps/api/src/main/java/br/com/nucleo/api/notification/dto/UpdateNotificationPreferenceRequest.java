package br.com.nucleo.api.notification.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateNotificationPreferenceRequest(

        @NotNull(message = "Informe se as notificações internas estão ativas")
        Boolean inAppEnabled,

        @NotNull(message = "Informe a preferência de notificações familiares")
        Boolean familyEnabled,

        @NotNull(message = "Informe a preferência de notificações da agenda")
        Boolean agendaEnabled,

        @NotNull(message = "Informe a preferência de notificações de compras")
        Boolean shoppingEnabled,

        @NotNull(message = "Informe a preferência de notificações financeiras")
        Boolean financeEnabled
) {
}