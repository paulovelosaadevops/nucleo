package br.com.nucleo.api.agenda.domain;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

import br.com.nucleo.api.family.domain.Family;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.identity.user.domain.User;
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
@Table(name = "agenda_events")
public class AgendaEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AgendaCategory category;

    @Column(length = 255)
    private String location;

    @Column(name = "all_day", nullable = false)
    private boolean allDay;

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(name = "ends_at")
    private Instant endsAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_membership_id")
    private FamilyMembership assignedTo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "recurrence_frequency", nullable = false, length = 20)
    private RecurrenceFrequency recurrenceFrequency;

    @Column(name = "recurrence_interval", nullable = false)
    private int recurrenceInterval;

    @Column(name = "recurrence_days_of_week", length = 100)
    private String recurrenceDaysOfWeek;

    @Column(name = "recurrence_until")
    private Instant recurrenceUntil;

    @Column(name = "recurrence_count")
    private Integer recurrenceCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected AgendaEvent() {
    }

    private AgendaEvent(
            Family family,
            String title,
            String description,
            AgendaCategory category,
            String location,
            boolean allDay,
            Instant startsAt,
            Instant endsAt,
            FamilyMembership assignedTo,
            User createdBy,
            RecurrenceFrequency recurrenceFrequency,
            int recurrenceInterval,
            String recurrenceDaysOfWeek,
            Instant recurrenceUntil,
            Integer recurrenceCount
    ) {
        this.family = Objects.requireNonNull(family);
        this.title = requireText(title, "Title", 2, 160);
        this.description = optionalText(description, 2000);
        this.category = Objects.requireNonNull(category);
        this.location = optionalText(location, 255);
        this.allDay = allDay;
        this.startsAt = Objects.requireNonNull(startsAt);
        this.endsAt = endsAt;
        this.assignedTo = assignedTo;
        this.createdBy = Objects.requireNonNull(createdBy);
        this.recurrenceFrequency =
                Objects.requireNonNull(recurrenceFrequency);
        this.recurrenceInterval = recurrenceInterval;
        this.recurrenceDaysOfWeek = recurrenceDaysOfWeek;
        this.recurrenceUntil = recurrenceUntil;
        this.recurrenceCount = recurrenceCount;

        validateDates();
        validateRecurrence();
    }

    public static AgendaEvent create(
            Family family,
            String title,
            String description,
            AgendaCategory category,
            String location,
            boolean allDay,
            Instant startsAt,
            Instant endsAt,
            FamilyMembership assignedTo,
            User createdBy,
            RecurrenceFrequency recurrenceFrequency,
            int recurrenceInterval,
            String recurrenceDaysOfWeek,
            Instant recurrenceUntil,
            Integer recurrenceCount
    ) {
        return new AgendaEvent(
                family,
                title,
                description,
                category,
                location,
                allDay,
                startsAt,
                endsAt,
                assignedTo,
                createdBy,
                recurrenceFrequency,
                recurrenceInterval,
                recurrenceDaysOfWeek,
                recurrenceUntil,
                recurrenceCount
        );
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

    private void validateDates() {
        if (endsAt != null && !endsAt.isAfter(startsAt)) {
            throw new IllegalArgumentException(
                    "End date must be after start date"
            );
        }
    }

    private void validateRecurrence() {
        if (
                recurrenceInterval < 1
                        || recurrenceInterval > 365
        ) {
            throw new IllegalArgumentException(
                    "Recurrence interval must be between 1 and 365"
            );
        }

        if (
                recurrenceCount != null
                        && (
                        recurrenceCount < 1
                                || recurrenceCount > 500
                )
        ) {
            throw new IllegalArgumentException(
                    "Recurrence count must be between 1 and 500"
            );
        }

        if (
                recurrenceUntil != null
                        && recurrenceUntil.isBefore(startsAt)
        ) {
            throw new IllegalArgumentException(
                    "Recurrence end cannot be before event start"
            );
        }

        if (
                recurrenceFrequency == RecurrenceFrequency.NONE
                        && (
                        recurrenceDaysOfWeek != null
                                || recurrenceUntil != null
                                || recurrenceCount != null
                )
        ) {
            throw new IllegalArgumentException(
                    "Non-recurring events cannot contain recurrence rules"
            );
        }
    }

    private static String requireText(
            String value,
            String field,
            int minimumLength,
            int maximumLength
    ) {
        String normalized = Objects.requireNonNull(value)
                .trim()
                .replaceAll("\\s+", " ");

        if (
                normalized.length() < minimumLength
                        || normalized.length() > maximumLength
        ) {
            throw new IllegalArgumentException(
                    field + " has an invalid length"
            );
        }

        return normalized;
    }

    private static String optionalText(
            String value,
            int maximumLength
    ) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim();

        if (normalized.length() > maximumLength) {
            throw new IllegalArgumentException(
                    "Text exceeds the maximum allowed length"
            );
        }

        return normalized;
    }

    public UUID getId() {
        return id;
    }

    public Family getFamily() {
        return family;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public AgendaCategory getCategory() {
        return category;
    }

    public String getLocation() {
        return location;
    }

    public boolean isAllDay() {
        return allDay;
    }

    public Instant getStartsAt() {
        return startsAt;
    }

    public Instant getEndsAt() {
        return endsAt;
    }

    public FamilyMembership getAssignedTo() {
        return assignedTo;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public RecurrenceFrequency getRecurrenceFrequency() {
        return recurrenceFrequency;
    }

    public int getRecurrenceInterval() {
        return recurrenceInterval;
    }

    public String getRecurrenceDaysOfWeek() {
        return recurrenceDaysOfWeek;
    }

    public Instant getRecurrenceUntil() {
        return recurrenceUntil;
    }

    public Integer getRecurrenceCount() {
        return recurrenceCount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public long getVersion() {
        return version;
    }
}