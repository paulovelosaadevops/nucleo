package br.com.nucleo.api.agenda.dto;

import br.com.nucleo.api.agenda.domain.AgendaCategory;
import br.com.nucleo.api.agenda.domain.OccurrenceStatus;
import br.com.nucleo.api.agenda.domain.RecurrenceFrequency;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AgendaOccurrenceDetailsResponse(
        UUID occurrenceId,
        UUID eventId,
        String title,
        String description,
        AgendaCategory category,
        String location,
        boolean allDay,
        Instant startsAt,
        Instant endsAt,
        OccurrenceStatus status,
        AgendaOccurrenceSummaryResponse.AssignedMember assignedTo,
        CreatedBy createdBy,
        Recurrence recurrence,
        List<Integer> remindersInMinutes,
        Instant completedAt,
        Instant cancelledAt,
        String notes
) {

    public record CreatedBy(
            UUID userId,
            String name
    ) {
    }

    public record Recurrence(
            RecurrenceFrequency frequency,
            int interval,
            String daysOfWeek,
            Instant until,
            Integer count
    ) {
    }
}