package br.com.nucleo.api.agenda.service;

import br.com.nucleo.api.agenda.domain.AgendaEvent;
import br.com.nucleo.api.agenda.domain.AgendaOccurrence;
import br.com.nucleo.api.agenda.domain.AgendaReminder;
import br.com.nucleo.api.agenda.domain.RecurrenceFrequency;
import br.com.nucleo.api.agenda.dto.CreateAgendaEventRequest;
import br.com.nucleo.api.agenda.dto.CreateAgendaEventResponse;
import br.com.nucleo.api.agenda.dto.RecurrenceRequest;
import br.com.nucleo.api.agenda.repository.AgendaEventRepository;
import br.com.nucleo.api.agenda.repository.AgendaOccurrenceRepository;
import br.com.nucleo.api.agenda.repository.AgendaReminderRepository;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.repository.FamilyMembershipRepository;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.notification.domain.NotificationType;
import br.com.nucleo.api.notification.service.NotificationService;
import java.time.DayOfWeek;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AgendaService {

    private final FamilyAccessService familyAccessService;
    private final FamilyMembershipRepository membershipRepository;
    private final AgendaEventRepository eventRepository;
    private final AgendaOccurrenceRepository occurrenceRepository;
    private final AgendaReminderRepository reminderRepository;
    private final AgendaOccurrenceGenerator occurrenceGenerator;
    private final NotificationService notificationService;

    public AgendaService(
            FamilyAccessService familyAccessService,
            FamilyMembershipRepository membershipRepository,
            AgendaEventRepository eventRepository,
            AgendaOccurrenceRepository occurrenceRepository,
            AgendaReminderRepository reminderRepository,
            AgendaOccurrenceGenerator occurrenceGenerator,
            NotificationService notificationService
    ) {
        this.familyAccessService = familyAccessService;
        this.membershipRepository = membershipRepository;
        this.eventRepository = eventRepository;
        this.occurrenceRepository = occurrenceRepository;
        this.reminderRepository = reminderRepository;
        this.occurrenceGenerator = occurrenceGenerator;
        this.notificationService = notificationService;
    }

    @Transactional
    public CreateAgendaEventResponse createEvent(
            UUID currentUserId,
            CreateAgendaEventRequest request
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        validateDates(request);

        FamilyMembership assignedTo = findAssignedMember(
                request.assignedToMembershipId(),
                currentMembership
        );

        NormalizedRecurrence recurrence =
                normalizeRecurrence(request);

        AgendaEvent event = AgendaEvent.create(
                currentMembership.getFamily(),
                request.title(),
                request.description(),
                request.category(),
                request.location(),
                request.allDay(),
                request.startsAt().toInstant(),
                request.endsAt() == null
                        ? null
                        : request.endsAt().toInstant(),
                assignedTo,
                currentMembership.getUser(),
                recurrence.frequency(),
                recurrence.interval(),
                recurrence.daysOfWeek(),
                recurrence.until(),
                recurrence.count()
        );

        eventRepository.save(event);

        List<AgendaOccurrence> occurrences =
                occurrenceGenerator.generate(event);

        if (occurrences.isEmpty()) {
            throw new IllegalArgumentException(
                    "A recorrência não gerou nenhuma ocorrência"
            );
        }

        occurrenceRepository.saveAll(occurrences);

        saveReminders(
                event,
                request.remindersInMinutes()
        );

        notificationService.notifyActiveFamilyMembers(
                currentMembership.getFamily(),
                currentMembership.getUser().getId(),
                NotificationType.AGENDA_EVENT_CREATED,
                "Novo compromisso na agenda",
                currentMembership.getUser().getName()
                        + " adicionou “"
                        + event.getTitle()
                        + "” à agenda da família.",
                "/agenda?eventId=" + event.getId(),
                event.getId(),
                "agenda-event-created:" + event.getId()
        );

        return new CreateAgendaEventResponse(
                event.getId(),
                event.getRecurrenceFrequency(),
                occurrences.size(),
                occurrences.get(0).getOccurrenceStartsAt(),
                occurrences.get(
                        occurrences.size() - 1
                ).getOccurrenceStartsAt()
        );
    }

    private FamilyMembership findAssignedMember(
            UUID membershipId,
            FamilyMembership currentMembership
    ) {
        if (membershipId == null) {
            return null;
        }

        FamilyMembership assignedMembership =
                membershipRepository
                        .findByIdAndFamily_Id(
                                membershipId,
                                currentMembership
                                        .getFamily()
                                        .getId()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Responsável não encontrado neste núcleo"
                                )
                        );

        if (!assignedMembership.isActive()) {
            throw new IllegalArgumentException(
                    "O responsável selecionado está inativo"
            );
        }

        return assignedMembership;
    }

    private void validateDates(
            CreateAgendaEventRequest request
    ) {
        if (
                request.endsAt() != null
                        && !request.endsAt().isAfter(
                        request.startsAt()
                )
        ) {
            throw new IllegalArgumentException(
                    "A data final deve ser posterior à data inicial"
            );
        }
    }

    private NormalizedRecurrence normalizeRecurrence(
            CreateAgendaEventRequest request
    ) {
        RecurrenceRequest recurrence = request.recurrence();

        if (
                recurrence == null
                        || recurrence.frequency()
                        == RecurrenceFrequency.NONE
        ) {
            ensureNoRulesForNonRecurringEvent(recurrence);

            return new NormalizedRecurrence(
                    RecurrenceFrequency.NONE,
                    1,
                    null,
                    null,
                    null
            );
        }

        int interval = recurrence.interval() == null
                ? 1
                : recurrence.interval();

        Set<DayOfWeek> days = recurrence.daysOfWeek();

        if (
                recurrence.frequency()
                        != RecurrenceFrequency.WEEKLY
                        && days != null
                        && !days.isEmpty()
        ) {
            throw new IllegalArgumentException(
                    "Dias da semana são permitidos apenas na recorrência semanal"
            );
        }

        String normalizedDays = normalizeDays(
                recurrence.frequency(),
                days
        );

        Instant until = recurrence.until() == null
                ? null
                : recurrence.until().toInstant();

        return new NormalizedRecurrence(
                recurrence.frequency(),
                interval,
                normalizedDays,
                until,
                recurrence.count()
        );
    }

    private void ensureNoRulesForNonRecurringEvent(
            RecurrenceRequest recurrence
    ) {
        if (recurrence == null) {
            return;
        }

        boolean containsExtraRules =
                recurrence.until() != null
                        || recurrence.count() != null
                        || (
                        recurrence.daysOfWeek() != null
                                && !recurrence
                                .daysOfWeek()
                                .isEmpty()
                );

        if (containsExtraRules) {
            throw new IllegalArgumentException(
                    "Evento sem recorrência não pode possuir regras de repetição"
            );
        }
    }

    private String normalizeDays(
            RecurrenceFrequency frequency,
            Set<DayOfWeek> days
    ) {
        if (
                frequency != RecurrenceFrequency.WEEKLY
                        || days == null
                        || days.isEmpty()
        ) {
            return null;
        }

        return days.stream()
                .sorted(
                        Comparator.comparingInt(
                                DayOfWeek::getValue
                        )
                )
                .map(Enum::name)
                .collect(Collectors.joining(","));
    }

    private void saveReminders(
            AgendaEvent event,
            List<Integer> reminders
    ) {
        if (reminders == null || reminders.isEmpty()) {
            return;
        }

        List<AgendaReminder> entities = reminders
                .stream()
                .distinct()
                .sorted()
                .map(minutes ->
                        AgendaReminder.create(
                                event,
                                minutes
                        )
                )
                .toList();

        reminderRepository.saveAll(entities);
    }

    private record NormalizedRecurrence(
            RecurrenceFrequency frequency,
            int interval,
            String daysOfWeek,
            Instant until,
            Integer count
    ) {
    }
}