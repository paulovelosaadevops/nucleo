package br.com.nucleo.api.agenda.dto;

import br.com.nucleo.api.agenda.domain.AgendaCategory;
import br.com.nucleo.api.agenda.domain.OccurrenceStatus;

import java.time.Instant;
import java.util.UUID;

public record AgendaOccurrenceSummaryResponse(
        UUID occurrenceId,
        UUID eventId,
        String title,
        AgendaCategory category,
        String location,
        boolean allDay,
        Instant startsAt,
        Instant endsAt,
        OccurrenceStatus status,
        AssignedMember assignedTo
) {

    public record AssignedMember(
            UUID membershipId,
            UUID userId,
            String name
    ) {
    }
}