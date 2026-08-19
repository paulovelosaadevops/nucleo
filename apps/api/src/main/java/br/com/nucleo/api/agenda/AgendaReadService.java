package br.com.nucleo.api.agenda;

import br.com.nucleo.api.common.error.ResourceNotFoundException;
import br.com.nucleo.api.family.FamilyAccessService;
import br.com.nucleo.api.family.FamilyMembership;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AgendaReadService {

    private static final Duration MAXIMUM_PERIOD =
            Duration.ofDays(366);

    private final FamilyAccessService familyAccessService;
    private final AgendaOccurrenceRepository occurrenceRepository;
    private final AgendaReminderRepository reminderRepository;

    public AgendaReadService(
            FamilyAccessService familyAccessService,
            AgendaOccurrenceRepository occurrenceRepository,
            AgendaReminderRepository reminderRepository
    ) {
        this.familyAccessService = familyAccessService;
        this.occurrenceRepository = occurrenceRepository;
        this.reminderRepository = reminderRepository;
    }

    @Transactional(readOnly = true)
    public List<AgendaOccurrenceSummaryResponse> list(
            UUID currentUserId,
            Instant periodStart,
            Instant periodEnd,
            OccurrenceStatus status,
            UUID assignedToMembershipId
    ) {
        validatePeriod(periodStart, periodEnd);

        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        return occurrenceRepository
                .findAllInPeriod(
                        currentMembership.getFamily().getId(),
                        periodStart,
                        periodEnd
                )
                .stream()
                .filter(occurrence ->
                        status == null
                                || occurrence.getStatus() == status
                )
                .filter(occurrence ->
                        matchesAssignedMember(
                                occurrence,
                                assignedToMembershipId
                        )
                )
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public AgendaOccurrenceDetailsResponse findById(
            UUID currentUserId,
            UUID occurrenceId
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        AgendaOccurrence occurrence = occurrenceRepository
                .findByIdAndEvent_Family_Id(
                        occurrenceId,
                        currentMembership.getFamily().getId()
                )
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Compromisso não encontrado"
                ));

        List<Integer> reminders = reminderRepository
                .findAllByEvent_IdOrderByMinutesBeforeAsc(
                        occurrence.getEvent().getId()
                )
                .stream()
                .map(AgendaReminder::getMinutesBefore)
                .toList();

        return toDetails(occurrence, reminders);
    }

    private void validatePeriod(
            Instant periodStart,
            Instant periodEnd
    ) {
        if (
                periodStart == null
                        || periodEnd == null
                        || !periodEnd.isAfter(periodStart)
        ) {
            throw new IllegalArgumentException(
                    "O período final deve ser posterior ao inicial"
            );
        }

        if (
                Duration.between(periodStart, periodEnd)
                        .compareTo(MAXIMUM_PERIOD) > 0
        ) {
            throw new IllegalArgumentException(
                    "O período consultado deve ter no máximo 366 dias"
            );
        }
    }

    private boolean matchesAssignedMember(
            AgendaOccurrence occurrence,
            UUID membershipId
    ) {
        if (membershipId == null) {
            return true;
        }

        FamilyMembership assigned =
                occurrence.getEvent().getAssignedTo();

        return assigned != null
                && assigned.getId().equals(membershipId);
    }

    private AgendaOccurrenceSummaryResponse toSummary(
            AgendaOccurrence occurrence
    ) {
        AgendaEvent event = occurrence.getEvent();

        return new AgendaOccurrenceSummaryResponse(
                occurrence.getId(),
                event.getId(),
                event.getTitle(),
                event.getCategory(),
                event.getLocation(),
                event.isAllDay(),
                occurrence.getOccurrenceStartsAt(),
                occurrence.getOccurrenceEndsAt(),
                occurrence.getStatus(),
                assignedMember(event.getAssignedTo())
        );
    }

    private AgendaOccurrenceDetailsResponse toDetails(
            AgendaOccurrence occurrence,
            List<Integer> reminders
    ) {
        AgendaEvent event = occurrence.getEvent();

        return new AgendaOccurrenceDetailsResponse(
                occurrence.getId(),
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getCategory(),
                event.getLocation(),
                event.isAllDay(),
                occurrence.getOccurrenceStartsAt(),
                occurrence.getOccurrenceEndsAt(),
                occurrence.getStatus(),
                assignedMember(event.getAssignedTo()),
                new AgendaOccurrenceDetailsResponse.CreatedBy(
                        event.getCreatedBy().getId(),
                        event.getCreatedBy().getName()
                ),
                new AgendaOccurrenceDetailsResponse.Recurrence(
                        event.getRecurrenceFrequency(),
                        event.getRecurrenceInterval(),
                        event.getRecurrenceDaysOfWeek(),
                        event.getRecurrenceUntil(),
                        event.getRecurrenceCount()
                ),
                reminders,
                occurrence.getCompletedAt(),
                occurrence.getCancelledAt(),
                occurrence.getNotes()
        );
    }

    private AgendaOccurrenceSummaryResponse.AssignedMember
    assignedMember(FamilyMembership membership) {
        if (membership == null) {
            return null;
        }

        return new AgendaOccurrenceSummaryResponse.AssignedMember(
                membership.getId(),
                membership.getUser().getId(),
                membership.getUser().getName()
        );
    }
}