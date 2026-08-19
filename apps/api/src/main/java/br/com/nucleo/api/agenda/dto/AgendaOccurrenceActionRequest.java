package br.com.nucleo.api.agenda.dto;

import jakarta.validation.constraints.Size;

public record AgendaOccurrenceActionRequest(

        @Size(
                max = 1000,
                message = "As observações devem ter no máximo 1000 caracteres"
        )
        String notes
) {
}