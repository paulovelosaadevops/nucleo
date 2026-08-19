package br.com.nucleo.api.family.domain;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Objects;
import java.util.UUID;

import br.com.nucleo.api.identity.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "families")
public class Family {

    private static final String DEFAULT_TIME_ZONE =
            "America/Sao_Paulo";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "time_zone", nullable = false, length = 50)
    private String timeZone;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected Family() {
    }

    private Family(String name, User createdBy) {
        this.name = normalizeName(name);
        this.timeZone = DEFAULT_TIME_ZONE;
        this.createdBy = Objects.requireNonNull(
                createdBy,
                "Family owner cannot be null"
        );
    }

    public static Family create(String name, User createdBy) {
        return new Family(name, createdBy);
    }

    @PrePersist
    private void onCreate() {
        Instant now = Instant.now();

        if (timeZone == null || timeZone.isBlank()) {
            timeZone = DEFAULT_TIME_ZONE;
        }

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = Instant.now();
    }

    public void rename(String newName) {
        name = normalizeName(newName);
    }

    public void changeTimeZone(String newTimeZone) {
        timeZone = normalizeTimeZone(newTimeZone);
    }

    private static String normalizeName(String value) {
        String normalized = Objects.requireNonNull(
                value,
                "Family name cannot be null"
        ).trim().replaceAll("\\s+", " ");

        if (normalized.length() < 2 || normalized.length() > 120) {
            throw new IllegalArgumentException(
                    "Family name must contain between 2 and 120 characters"
            );
        }

        return normalized;
    }

    private static String normalizeTimeZone(String value) {
        String normalized = Objects.requireNonNull(
                value,
                "Time zone cannot be null"
        ).trim();

        try {
            return ZoneId.of(normalized).getId();
        } catch (DateTimeException exception) {
            throw new IllegalArgumentException(
                    "Invalid time zone: " + normalized,
                    exception
            );
        }
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getTimeZone() {
        return timeZone;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public long getVersion() {
        return version;
    }
}