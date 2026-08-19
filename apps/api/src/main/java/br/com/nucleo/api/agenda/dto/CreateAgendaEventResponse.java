package br.com.nucleo.api.agenda.dto;

import br.com.nucleo.api.agenda.domain.RecurrenceFrequency;

import java.time.Instant;
import java.util.UUID;

public record CreateAgendaEventResponse(
        UUID eventId,
        RecurrenceFrequency recurrenceFrequency,
        int occurrencesCreated,
        Instant firstOccurrenceStartsAt,
        Instant lastOccurrenceStartsAt
) {
}