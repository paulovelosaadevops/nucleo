package br.com.nucleo.api.agenda;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

import br.com.nucleo.api.identity.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "agenda_event_occurrences")
public class AgendaOccurrence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private AgendaEvent event;

    @Column(name = "occurrence_starts_at", nullable = false)
    private Instant occurrenceStartsAt;

    @Column(name = "occurrence_ends_at")
    private Instant occurrenceEndsAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OccurrenceStatus status;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_changed_by_user_id")
    private User statusChangedBy;

    @Column(length = 1000)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected AgendaOccurrence() {
    }

    private AgendaOccurrence(
            AgendaEvent event,
            Instant occurrenceStartsAt,
            Instant occurrenceEndsAt
    ) {
        this.event = Objects.requireNonNull(event);
        this.occurrenceStartsAt =
                Objects.requireNonNull(occurrenceStartsAt);
        this.occurrenceEndsAt = occurrenceEndsAt;
        this.status = OccurrenceStatus.SCHEDULED;

        validateDates();
    }

    public static AgendaOccurrence create(
            AgendaEvent event,
            Instant startsAt,
            Instant endsAt
    ) {
        return new AgendaOccurrence(event, startsAt, endsAt);
    }

    @PrePersist
    private void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = Instant.now();
    }

    public void complete(User user, String notes) {
        requireScheduled();

        status = OccurrenceStatus.COMPLETED;
        completedAt = Instant.now();
        cancelledAt = null;
        statusChangedBy = Objects.requireNonNull(user);
        this.notes = normalizeNotes(notes);
    }

    public void cancel(User user, String notes) {
        requireScheduled();

        status = OccurrenceStatus.CANCELLED;
        cancelledAt = Instant.now();
        completedAt = null;
        statusChangedBy = Objects.requireNonNull(user);
        this.notes = normalizeNotes(notes);
    }

    private void requireScheduled() {
        if (status != OccurrenceStatus.SCHEDULED) {
            throw new IllegalStateException(
                    "Only scheduled occurrences can be changed"
            );
        }
    }

    private void validateDates() {
        if (
                occurrenceEndsAt != null
                        && !occurrenceEndsAt.isAfter(
                        occurrenceStartsAt
                )
        ) {
            throw new IllegalArgumentException(
                    "Occurrence end must be after its start"
            );
        }
    }

    private String normalizeNotes(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim();

        if (normalized.length() > 1000) {
            throw new IllegalArgumentException(
                    "Notes must contain at most 1000 characters"
            );
        }

        return normalized;
    }

    public UUID getId() {
        return id;
    }

    public AgendaEvent getEvent() {
        return event;
    }

    public Instant getOccurrenceStartsAt() {
        return occurrenceStartsAt;
    }

    public Instant getOccurrenceEndsAt() {
        return occurrenceEndsAt;
    }

    public OccurrenceStatus getStatus() {
        return status;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public User getStatusChangedBy() {
        return statusChangedBy;
    }

    public String getNotes() {
        return notes;
    }

    public long getVersion() {
        return version;
    }
}