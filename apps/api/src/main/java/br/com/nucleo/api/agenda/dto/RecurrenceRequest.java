package br.com.nucleo.api.agenda.dto;

import br.com.nucleo.api.agenda.domain.RecurrenceFrequency;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.DayOfWeek;
import java.time.OffsetDateTime;
import java.util.Set;

public record RecurrenceRequest(

        @NotNull(message = "Informe a frequência da recorrência")
        RecurrenceFrequency frequency,

        @Min(
                value = 1,
                message = "O intervalo mínimo da recorrência é 1"
        )
        @Max(
                value = 365,
                message = "O intervalo máximo da recorrência é 365"
        )
        Integer interval,

        Set<DayOfWeek> daysOfWeek,

        OffsetDateTime until,

        @Min(
                value = 1,
                message = "A recorrência deve gerar ao menos uma ocorrência"
        )
        @Max(
                value = 500,
                message = "A recorrência deve gerar no máximo 500 ocorrências"
        )
        Integer count
) {
}