package br.com.nucleo.api.agenda.dto;

import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

public record DuplicateAgendaEventRequest(

        @Size(
                min = 2,
                max = 160,
                message = "O título deve ter entre 2 e 160 caracteres"
        )
        String title,

        OffsetDateTime startsAt,

        OffsetDateTime endsAt
) {
}