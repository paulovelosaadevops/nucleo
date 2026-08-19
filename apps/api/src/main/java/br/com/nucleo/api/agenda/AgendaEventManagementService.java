package br.com.nucleo.api.agenda;

import br.com.nucleo.api.common.error.ForbiddenOperationException;
import br.com.nucleo.api.common.error.ResourceNotFoundException;
import br.com.nucleo.api.family.FamilyAccessService;
import br.com.nucleo.api.family.FamilyMembership;
import br.com.nucleo.api.family.FamilyRole;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AgendaEventManagementService {

    private static final String COPY_SUFFIX = " (cópia)";

    private final FamilyAccessService familyAccessService;
    private final AgendaEventRepository eventRepository;
    private final AgendaOccurrenceRepository occurrenceRepository;
    private final AgendaReminderRepository reminderRepository;
    private final AgendaOccurrenceGenerator occurrenceGenerator;

    public AgendaEventManagementService(
            FamilyAccessService familyAccessService,
            AgendaEventRepository eventRepository,
            AgendaOccurrenceRepository occurrenceRepository,
            AgendaReminderRepository reminderRepository,
            AgendaOccurrenceGenerator occurrenceGenerator
    ) {
        this.familyAccessService = familyAccessService;
        this.eventRepository = eventRepository;
        this.occurrenceRepository = occurrenceRepository;
        this.reminderRepository = reminderRepository;
        this.occurrenceGenerator = occurrenceGenerator;
    }

    @Transactional
    public CreateAgendaEventResponse duplicateOccurrence(
            UUID currentUserId,
            UUID occurrenceId,
            DuplicateAgendaEventRequest request
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        AgendaOccurrence sourceOccurrence = occurrenceRepository
                .findByIdAndEvent_Family_Id(
                        occurrenceId,
                        currentMembership.getFamily().getId()
                )
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Compromisso não encontrado"
                ));

        AgendaEvent sourceEvent = sourceOccurrence.getEvent();

        Instant duplicatedStart = request != null
                && request.startsAt() != null
                ? request.startsAt().toInstant()
                : sourceOccurrence.getOccurrenceStartsAt();

        Instant duplicatedEnd = duplicatedEnd(
                sourceOccurrence,
                duplicatedStart,
                request
        );

        String duplicatedTitle = request != null
                && request.title() != null
                && !request.title().isBlank()
                ? request.title()
                : copyTitle(sourceEvent.getTitle());

        FamilyMembership assignedTo =
                sourceEvent.getAssignedTo();

        if (assignedTo != null && !assignedTo.isActive()) {
            assignedTo = null;
        }

        AgendaEvent duplicatedEvent = AgendaEvent.create(
                currentMembership.getFamily(),
                duplicatedTitle,
                sourceEvent.getDescription(),
                sourceEvent.getCategory(),
                sourceEvent.getLocation(),
                sourceEvent.isAllDay(),
                duplicatedStart,
                duplicatedEnd,
                assignedTo,
                currentMembership.getUser(),
                RecurrenceFrequency.NONE,
                1,
                null,
                null,
                null
        );

        eventRepository.save(duplicatedEvent);

        List<AgendaOccurrence> occurrences =
                occurrenceGenerator.generate(duplicatedEvent);

        occurrenceRepository.saveAll(occurrences);

        copyReminders(sourceEvent, duplicatedEvent);

        AgendaOccurrence duplicatedOccurrence =
                occurrences.get(0);

        return new CreateAgendaEventResponse(
                duplicatedEvent.getId(),
                RecurrenceFrequency.NONE,
                1,
                duplicatedOccurrence.getOccurrenceStartsAt(),
                duplicatedOccurrence.getOccurrenceStartsAt()
        );
    }

    @Transactional
    public void deleteOccurrence(
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

        requireManagementPermission(
                currentMembership,
                occurrence.getEvent()
        );

        AgendaEvent event = occurrence.getEvent();

        occurrenceRepository.delete(occurrence);
        occurrenceRepository.flush();

        boolean eventHasOccurrences = !occurrenceRepository
                .findAllByEvent_IdOrderByOccurrenceStartsAtAsc(
                        event.getId()
                )
                .isEmpty();

        if (!eventHasOccurrences) {
            eventRepository.delete(event);
        }
    }

    @Transactional
    public void deleteEventSeries(
            UUID currentUserId,
            UUID eventId
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        AgendaEvent event = eventRepository
                .findByIdAndFamily_Id(
                        eventId,
                        currentMembership.getFamily().getId()
                )
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Evento não encontrado"
                ));

        requireManagementPermission(currentMembership, event);

        eventRepository.delete(event);
    }

    private Instant duplicatedEnd(
            AgendaOccurrence sourceOccurrence,
            Instant duplicatedStart,
            DuplicateAgendaEventRequest request
    ) {
        if (request != null && request.endsAt() != null) {
            Instant requestedEnd = request.endsAt().toInstant();

            if (!requestedEnd.isAfter(duplicatedStart)) {
                throw new IllegalArgumentException(
                        "A data final deve ser posterior à inicial"
                );
            }

            return requestedEnd;
        }

        if (sourceOccurrence.getOccurrenceEndsAt() == null) {
            return null;
        }

        Duration originalDuration = Duration.between(
                sourceOccurrence.getOccurrenceStartsAt(),
                sourceOccurrence.getOccurrenceEndsAt()
        );

        return duplicatedStart.plus(originalDuration);
    }

    private void copyReminders(
            AgendaEvent source,
            AgendaEvent target
    ) {
        List<AgendaReminder> reminders = reminderRepository
                .findAllByEvent_IdOrderByMinutesBeforeAsc(
                        source.getId()
                )
                .stream()
                .map(reminder ->
                        AgendaReminder.create(
                                target,
                                reminder.getMinutesBefore()
                        )
                )
                .toList();

        reminderRepository.saveAll(reminders);
    }

    private void requireManagementPermission(
            FamilyMembership membership,
            AgendaEvent event
    ) {
        boolean administrator =
                membership.getRole() == FamilyRole.OWNER
                        || membership.getRole() == FamilyRole.ADMIN;

        boolean creator = event
                .getCreatedBy()
                .getId()
                .equals(membership.getUser().getId());

        if (!administrator && !creator) {
            throw new ForbiddenOperationException(
                    "Somente o criador ou um administrador pode excluir este compromisso"
            );
        }
    }

    private String copyTitle(String originalTitle) {
        int maximumBaseLength = 160 - COPY_SUFFIX.length();

        String baseTitle = originalTitle.length()
                <= maximumBaseLength
                ? originalTitle
                : originalTitle.substring(0, maximumBaseLength);

        return baseTitle + COPY_SUFFIX;
    }
}