package br.com.nucleo.api.notification.domain;

import br.com.nucleo.api.family.domain.Family;
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
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(
        name = "notification_preferences",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_notification_preferences_family_user",
                        columnNames = {
                                "family_id",
                                "user_id"
                        }
                )
        }
)
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "in_app_enabled", nullable = false)
    private boolean inAppEnabled;

    @Column(name = "family_enabled", nullable = false)
    private boolean familyEnabled;

    @Column(name = "agenda_enabled", nullable = false)
    private boolean agendaEnabled;

    @Column(name = "shopping_enabled", nullable = false)
    private boolean shoppingEnabled;

    @Column(name = "finance_enabled", nullable = false)
    private boolean financeEnabled;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected NotificationPreference() {
    }

    private NotificationPreference(
            Family family,
            User user
    ) {
        this.family = Objects.requireNonNull(
                family,
                "Notification preference family cannot be null"
        );
        this.user = Objects.requireNonNull(
                user,
                "Notification preference user cannot be null"
        );
        this.inAppEnabled = true;
        this.familyEnabled = true;
        this.agendaEnabled = true;
        this.shoppingEnabled = true;
        this.financeEnabled = true;
    }

    public static NotificationPreference createDefault(
            Family family,
            User user
    ) {
        return new NotificationPreference(family, user);
    }

    public void update(
            boolean inAppEnabled,
            boolean familyEnabled,
            boolean agendaEnabled,
            boolean shoppingEnabled,
            boolean financeEnabled
    ) {
        this.inAppEnabled = inAppEnabled;
        this.familyEnabled = familyEnabled;
        this.agendaEnabled = agendaEnabled;
        this.shoppingEnabled = shoppingEnabled;
        this.financeEnabled = financeEnabled;
    }

    public boolean allows(NotificationType type) {
        if (!inAppEnabled) {
            return false;
        }

        return switch (type) {
            case FAMILY_INVITATION,
                    FAMILY_MEMBER_JOINED,
                    FAMILY_ROLE_CHANGED ->
                    familyEnabled;

            case AGENDA_EVENT_CREATED,
                    AGENDA_EVENT_UPDATED,
                    AGENDA_REMINDER ->
                    agendaEnabled;

            case SHOPPING_LIST_UPDATED,
                    SHOPPING_ITEM_ADDED ->
                    shoppingEnabled;

            case FINANCIAL_BUDGET_ALERT,
                    FINANCIAL_TRANSACTION_DUE,
                    CREDIT_CARD_INVOICE_DUE ->
                    financeEnabled;

            case SYSTEM -> true;
        };
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

    public UUID getId() {
        return id;
    }

    public Family getFamily() {
        return family;
    }

    public User getUser() {
        return user;
    }

    public boolean isInAppEnabled() {
        return inAppEnabled;
    }

    public boolean isFamilyEnabled() {
        return familyEnabled;
    }

    public boolean isAgendaEnabled() {
        return agendaEnabled;
    }

    public boolean isShoppingEnabled() {
        return shoppingEnabled;
    }

    public boolean isFinanceEnabled() {
        return financeEnabled;
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