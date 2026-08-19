package br.com.nucleo.api.agenda;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CreateAgendaEventRequest(

        @NotBlank(message = "Informe o título")
        @Size(
                min = 2,
                max = 160,
                message = "O título deve ter entre 2 e 160 caracteres"
        )
        String title,

        @Size(
                max = 2000,
                message = "A descrição deve ter no máximo 2000 caracteres"
        )
        String description,

        @NotNull(message = "Informe a categoria")
        AgendaCategory category,

        @Size(
                max = 255,
                message = "O local deve ter no máximo 255 caracteres"
        )
        String location,

        boolean allDay,

        @NotNull(message = "Informe a data inicial")
        OffsetDateTime startsAt,

        OffsetDateTime endsAt,

        UUID assignedToMembershipId,

        @Valid
        RecurrenceRequest recurrence,

        List<
                @Min(
                        value = 0,
                        message = "O lembrete não pode ser negativo"
                )
                @Max(
                        value = 10080,
                        message = "O lembrete máximo é de sete dias"
                )
                Integer
        > remindersInMinutes
) {
}