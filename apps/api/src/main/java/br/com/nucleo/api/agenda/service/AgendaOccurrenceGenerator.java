package br.com.nucleo.api.agenda.service;

import br.com.nucleo.api.agenda.domain.AgendaEvent;
import br.com.nucleo.api.agenda.domain.AgendaOccurrence;
import br.com.nucleo.api.agenda.domain.RecurrenceFrequency;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class AgendaOccurrenceGenerator {

    private static final int MAXIMUM_OCCURRENCES = 500;

    public List<AgendaOccurrence> generate(AgendaEvent event) {
        if (
                event.getRecurrenceFrequency()
                        == RecurrenceFrequency.NONE
        ) {
            return List.of(createOccurrence(
                    event,
                    event.getStartsAt()
            ));
        }

        ZoneId zoneId = ZoneId.of(
                event.getFamily().getTimeZone()
        );

        ZonedDateTime initialDateTime =
                event.getStartsAt().atZone(zoneId);

        Instant effectiveUntil = effectiveUntil(
                event,
                initialDateTime
        );

        return switch (event.getRecurrenceFrequency()) {
            case DAILY -> generateDaily(
                    event,
                    initialDateTime,
                    effectiveUntil
            );
            case WEEKLY -> generateWeekly(
                    event,
                    initialDateTime,
                    effectiveUntil
            );
            case MONTHLY -> generateMonthly(
                    event,
                    initialDateTime,
                    effectiveUntil
            );
            case YEARLY -> generateYearly(
                    event,
                    initialDateTime,
                    effectiveUntil
            );
            case NONE -> throw new IllegalStateException(
                    "Unexpected non-recurring event"
            );
        };
    }

    private List<AgendaOccurrence> generateDaily(
            AgendaEvent event,
            ZonedDateTime initialDateTime,
            Instant effectiveUntil
    ) {
        List<AgendaOccurrence> occurrences = new ArrayList<>();

        for (int index = 0; index < MAXIMUM_OCCURRENCES; index++) {
            ZonedDateTime candidate = initialDateTime.plusDays(
                    (long) index * event.getRecurrenceInterval()
            );

            if (mustStop(event, candidate.toInstant(),
                    effectiveUntil, occurrences.size())) {
                break;
            }

            occurrences.add(
                    createOccurrence(event, candidate.toInstant())
            );
        }

        return occurrences;
    }

    private List<AgendaOccurrence> generateMonthly(
            AgendaEvent event,
            ZonedDateTime initialDateTime,
            Instant effectiveUntil
    ) {
        List<AgendaOccurrence> occurrences = new ArrayList<>();

        for (int index = 0; index < MAXIMUM_OCCURRENCES; index++) {
            ZonedDateTime candidate = initialDateTime.plusMonths(
                    (long) index * event.getRecurrenceInterval()
            );

            if (mustStop(event, candidate.toInstant(),
                    effectiveUntil, occurrences.size())) {
                break;
            }

            occurrences.add(
                    createOccurrence(event, candidate.toInstant())
            );
        }

        return occurrences;
    }

    private List<AgendaOccurrence> generateYearly(
            AgendaEvent event,
            ZonedDateTime initialDateTime,
            Instant effectiveUntil
    ) {
        List<AgendaOccurrence> occurrences = new ArrayList<>();

        for (int index = 0; index < MAXIMUM_OCCURRENCES; index++) {
            ZonedDateTime candidate = initialDateTime.plusYears(
                    (long) index * event.getRecurrenceInterval()
            );

            if (mustStop(event, candidate.toInstant(),
                    effectiveUntil, occurrences.size())) {
                break;
            }

            occurrences.add(
                    createOccurrence(event, candidate.toInstant())
            );
        }

        return occurrences;
    }

    private List<AgendaOccurrence> generateWeekly(
            AgendaEvent event,
            ZonedDateTime initialDateTime,
            Instant effectiveUntil
    ) {
        List<AgendaOccurrence> occurrences = new ArrayList<>();

        Set<DayOfWeek> selectedDays = recurrenceDays(
                event,
                initialDateTime.getDayOfWeek()
        );

        LocalDate firstWeekStart = initialDateTime
                .toLocalDate()
                .with(
                        TemporalAdjusters.previousOrSame(
                                DayOfWeek.MONDAY
                        )
                );

        int weekIndex = 0;

        while (occurrences.size() < MAXIMUM_OCCURRENCES) {
            LocalDate weekStart = firstWeekStart.plusWeeks(
                    (long) weekIndex
                            * event.getRecurrenceInterval()
            );

            boolean periodFinished = false;

            for (DayOfWeek day : selectedDays) {
                LocalDate candidateDate = weekStart.plusDays(
                        day.getValue() - DayOfWeek.MONDAY.getValue()
                );

                ZonedDateTime candidate = candidateDate
                        .atTime(initialDateTime.toLocalTime())
                        .atZone(initialDateTime.getZone());

                if (candidate.isBefore(initialDateTime)) {
                    continue;
                }

                if (mustStop(
                        event,
                        candidate.toInstant(),
                        effectiveUntil,
                        occurrences.size()
                )) {
                    periodFinished = true;
                    break;
                }

                occurrences.add(
                        createOccurrence(event, candidate.toInstant())
                );
            }

            if (
                    periodFinished
                            || reachedRequestedCount(
                            event,
                            occurrences.size()
                    )
            ) {
                break;
            }

            weekIndex++;
        }

        return occurrences;
    }

    private Set<DayOfWeek> recurrenceDays(
            AgendaEvent event,
            DayOfWeek defaultDay
    ) {
        String configuredDays =
                event.getRecurrenceDaysOfWeek();

        if (
                configuredDays == null
                        || configuredDays.isBlank()
        ) {
            return EnumSet.of(defaultDay);
        }

        EnumSet<DayOfWeek> days =
                EnumSet.noneOf(DayOfWeek.class);

        for (String value : configuredDays.split(",")) {
            try {
                days.add(
                        DayOfWeek.valueOf(
                                value.trim()
                                        .toUpperCase(Locale.ROOT)
                        )
                );
            } catch (IllegalArgumentException exception) {
                throw new IllegalArgumentException(
                        "Invalid recurrence day: " + value
                );
            }
        }

        if (days.isEmpty()) {
            days.add(defaultDay);
        }

        return days;
    }

    private AgendaOccurrence createOccurrence(
            AgendaEvent event,
            Instant occurrenceStart
    ) {
        Instant occurrenceEnd = null;

        if (event.getEndsAt() != null) {
            Duration duration = Duration.between(
                    event.getStartsAt(),
                    event.getEndsAt()
            );

            occurrenceEnd = occurrenceStart.plus(duration);
        }

        return AgendaOccurrence.create(
                event,
                occurrenceStart,
                occurrenceEnd
        );
    }

    private Instant effectiveUntil(
            AgendaEvent event,
            ZonedDateTime initialDateTime
    ) {
        if (event.getRecurrenceUntil() != null) {
            return event.getRecurrenceUntil();
        }

        if (event.getRecurrenceCount() != null) {
            return null;
        }

        return initialDateTime
                .plusYears(1)
                .toInstant();
    }

    private boolean mustStop(
            AgendaEvent event,
            Instant candidate,
            Instant effectiveUntil,
            int generatedCount
    ) {
        if (generatedCount >= MAXIMUM_OCCURRENCES) {
            return true;
        }

        if (reachedRequestedCount(event, generatedCount)) {
            return true;
        }

        return effectiveUntil != null
                && candidate.isAfter(effectiveUntil);
    }

    private boolean reachedRequestedCount(
            AgendaEvent event,
            int generatedCount
    ) {
        return event.getRecurrenceCount() != null
                && generatedCount >= event.getRecurrenceCount();
    }
}