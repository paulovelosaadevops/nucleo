package br.com.nucleo.api.agenda.domain;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "agenda_event_reminders")
public class AgendaReminder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private AgendaEvent event;

    @Column(name = "minutes_before", nullable = false)
    private int minutesBefore;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AgendaReminder() {
    }

    private AgendaReminder(
            AgendaEvent event,
            int minutesBefore
    ) {
        this.event = Objects.requireNonNull(event);

        if (minutesBefore < 0 || minutesBefore > 10080) {
            throw new IllegalArgumentException(
                    "Reminder must be between 0 and 10080 minutes"
            );
        }

        this.minutesBefore = minutesBefore;
    }

    public static AgendaReminder create(
            AgendaEvent event,
            int minutesBefore
    ) {
        return new AgendaReminder(event, minutesBefore);
    }

    @PrePersist
    private void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public AgendaEvent getEvent() {
        return event;
    }

    public int getMinutesBefore() {
        return minutesBefore;
    }
}