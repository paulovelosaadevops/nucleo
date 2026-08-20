package br.com.nucleo.api.notification.domain;

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
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_user_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private NotificationType type;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(name = "action_path", length = 500)
    private String actionPath;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "deduplication_key", length = 200)
    private String deduplicationKey;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private Instant createdAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected Notification() {
    }

    private Notification(
            Family family,
            User recipient,
            NotificationType type,
            String title,
            String message,
            String actionPath,
            UUID referenceId,
            String deduplicationKey
    ) {
        this.family = Objects.requireNonNull(
                family,
                "Notification family cannot be null"
        );
        this.recipient = Objects.requireNonNull(
                recipient,
                "Notification recipient cannot be null"
        );
        this.type = Objects.requireNonNull(
                type,
                "Notification type cannot be null"
        );
        this.title = normalizeRequiredText(
                title,
                "Notification title",
                160
        );
        this.message = normalizeRequiredText(
                message,
                "Notification message",
                500
        );
        this.actionPath = normalizeOptionalText(
                actionPath,
                "Notification action path",
                500
        );
        this.referenceId = referenceId;
        this.deduplicationKey = normalizeOptionalText(
                deduplicationKey,
                "Notification deduplication key",
                200
        );
    }

    public static Notification create(
            Family family,
            User recipient,
            NotificationType type,
            String title,
            String message,
            String actionPath,
            UUID referenceId,
            String deduplicationKey
    ) {
        return new Notification(
                family,
                recipient,
                type,
                title,
                message,
                actionPath,
                referenceId,
                deduplicationKey
        );
    }

    public void markAsRead() {
        if (readAt == null) {
            readAt = Instant.now();
        }
    }

    public void markAsUnread() {
        readAt = null;
    }

    public boolean isRead() {
        return readAt != null;
    }

    @PrePersist
    private void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
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

    public User getRecipient() {
        return recipient;
    }

    public NotificationType getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public String getActionPath() {
        return actionPath;
    }

    public UUID getReferenceId() {
        return referenceId;
    }

    public String getDeduplicationKey() {
        return deduplicationKey;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public long getVersion() {
        return version;
    }
}