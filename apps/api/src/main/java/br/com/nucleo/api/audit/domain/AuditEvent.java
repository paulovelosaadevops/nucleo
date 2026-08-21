package br.com.nucleo.api.audit.domain;

import br.com.nucleo.api.family.domain.Family;
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
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "audit_events")
public class AuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id")
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private AuditAction action;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false, length = 60)
    private AuditResourceType resourceType;

    @Column(name = "resource_id")
    private UUID resourceId;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(
            name = "occurred_at",
            nullable = false,
            updatable = false
    )
    private Instant occurredAt;

    protected AuditEvent() {
    }

    private AuditEvent(
            Family family,
            User actor,
            AuditAction action,
            AuditResourceType resourceType,
            UUID resourceId,
            String description,
            String metadataJson,
            String ipAddress,
            String userAgent
    ) {
        this.family = Objects.requireNonNull(
                family,
                "Audit family cannot be null"
        );
        this.actor = actor;
        this.action = Objects.requireNonNull(
                action,
                "Audit action cannot be null"
        );
        this.resourceType = Objects.requireNonNull(
                resourceType,
                "Audit resource type cannot be null"
        );
        this.resourceId = resourceId;
        this.description = normalizeRequiredText(
                description,
                "Audit description",
                500
        );
        this.metadataJson = normalizeOptionalText(
                metadataJson,
                "Audit metadata",
                10000
        );
        this.ipAddress = normalizeOptionalText(
                ipAddress,
                "Audit IP address",
                64
        );
        this.userAgent = normalizeOptionalText(
                userAgent,
                "Audit user agent",
                500
        );
    }

    public static AuditEvent create(
            Family family,
            User actor,
            AuditAction action,
            AuditResourceType resourceType,
            UUID resourceId,
            String description,
            String metadataJson,
            String ipAddress,
            String userAgent
    ) {
        return new AuditEvent(
                family,
                actor,
                action,
                resourceType,
                resourceId,
                description,
                metadataJson,
                ipAddress,
                userAgent
        );
    }

    @PrePersist
    private void onCreate() {
        if (occurredAt == null) {
            occurredAt = Instant.now();
        }
    }

    private static String normalizeRequiredText(
            String value,
            String fieldName,
            int maximumLength
    ) {
        String normalized = Objects.requireNonNull(
                value,
                fieldName + " cannot be null"
        ).trim().replaceAll("\\s+", " ");

        if (normalized.isBlank()) {
            throw new IllegalArgumentException(
                    fieldName + " cannot be blank"
            );
        }

        if (normalized.length() > maximumLength) {
            throw new IllegalArgumentException(
                    fieldName
                            + " cannot contain more than "
                            + maximumLength
                            + " characters"
            );
        }

        return normalized;
    }

    private static String normalizeOptionalText(
            String value,
            String fieldName,
            int maximumLength
    ) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim();

        if (normalized.length() > maximumLength) {
            throw new IllegalArgumentException(
                    fieldName
                            + " cannot contain more than "
                            + maximumLength
                            + " characters"
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

    public User getActor() {
        return actor;
    }

    public AuditAction getAction() {
        return action;
    }

    public AuditResourceType getResourceType() {
        return resourceType;
    }

    public UUID getResourceId() {
        return resourceId;
    }

    public String getDescription() {
        return description;
    }

    public String getMetadataJson() {
        return metadataJson;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }
}