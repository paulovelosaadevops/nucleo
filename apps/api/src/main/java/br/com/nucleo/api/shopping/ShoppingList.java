package br.com.nucleo.api.shopping;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

import br.com.nucleo.api.family.Family;
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
@Table(name = "shopping_lists")
public class ShoppingList {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ShoppingListStatus status;

    @Column(name = "due_date")
    private LocalDate dueDate;

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

    protected ShoppingList() {
    }

    private ShoppingList(
            Family family,
            String name,
            String description,
            LocalDate dueDate,
            User createdBy
    ) {
        this.family = Objects.requireNonNull(
                family,
                "Family cannot be null"
        );
        this.name = normalizeName(name);
        this.description = normalizeOptionalText(description, 500);
        this.dueDate = dueDate;
        this.createdBy = Objects.requireNonNull(
                createdBy,
                "List creator cannot be null"
        );
        this.status = ShoppingListStatus.ACTIVE;
    }

    public static ShoppingList create(
            Family family,
            String name,
            String description,
            LocalDate dueDate,
            User createdBy
    ) {
        return new ShoppingList(
                family,
                name,
                description,
                dueDate,
                createdBy
        );
    }

    public void update(
            String name,
            String description,
            LocalDate dueDate
    ) {
        ensureNotArchived();

        this.name = normalizeName(name);
        this.description = normalizeOptionalText(description, 500);
        this.dueDate = dueDate;
    }

    public void complete() {
        ensureNotArchived();
        status = ShoppingListStatus.COMPLETED;
    }

    public void reopen() {
        if (status == ShoppingListStatus.ARCHIVED) {
            throw new IllegalStateException(
                    "Archived shopping list cannot be reopened"
            );
        }

        status = ShoppingListStatus.ACTIVE;
    }

    public void archive() {
        status = ShoppingListStatus.ARCHIVED;
    }

    public boolean isActive() {
        return status == ShoppingListStatus.ACTIVE;
    }

    public boolean isCompleted() {
        return status == ShoppingListStatus.COMPLETED;
    }

    public boolean isArchived() {
        return status == ShoppingListStatus.ARCHIVED;
    }

    private void ensureNotArchived() {
        if (isArchived()) {
            throw new IllegalStateException(
                    "Archived shopping list cannot be changed"
            );
        }
    }

    @PrePersist
    private void onCreate() {
        Instant now = Instant.now();

        createdAt = now;
        updatedAt = now;

        if (status == null) {
            status = ShoppingListStatus.ACTIVE;
        }
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = Instant.now();
    }

    private static String normalizeName(String value) {
        String normalized = Objects.requireNonNull(
                value,
                "Shopping list name cannot be null"
        ).trim().replaceAll("\\s+", " ");

        if (normalized.length() < 2 || normalized.length() > 120) {
            throw new IllegalArgumentException(
                    "Shopping list name must contain between 2 and 120 characters"
            );
        }

        return normalized;
    }

    private static String normalizeOptionalText(
            String value,
            int maximumLength
    ) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim().replaceAll("\\s+", " ");

        if (normalized.length() > maximumLength) {
            throw new IllegalArgumentException(
                    "Text cannot contain more than "
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

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public ShoppingListStatus getStatus() {
        return status;
    }

    public LocalDate getDueDate() {
        return dueDate;
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