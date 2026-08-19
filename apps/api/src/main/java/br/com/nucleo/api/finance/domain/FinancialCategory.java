package br.com.nucleo.api.finance.domain;

import br.com.nucleo.api.family.domain.Family;
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
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "financial_categories")
public class FinancialCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @Column(nullable = false, length = 80)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FinancialCategoryType type;

    @Column(length = 20)
    private String color;

    @Column(length = 50)
    private String icon;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected FinancialCategory() {
    }

    private FinancialCategory(
            Family family,
            String name,
            FinancialCategoryType type,
            String color,
            String icon
    ) {
        this.family = Objects.requireNonNull(
                family,
                "Family cannot be null"
        );
        this.name = normalizeName(name);
        this.type = Objects.requireNonNull(
                type,
                "Financial category type cannot be null"
        );
        this.color = normalizeOptionalText(color, 20);
        this.icon = normalizeOptionalText(icon, 50);
        this.active = true;
    }

    public static FinancialCategory create(
            Family family,
            String name,
            FinancialCategoryType type,
            String color,
            String icon
    ) {
        return new FinancialCategory(
                family,
                name,
                type,
                color,
                icon
        );
    }

    public void update(
            String name,
            String color,
            String icon
    ) {
        this.name = normalizeName(name);
        this.color = normalizeOptionalText(color, 20);
        this.icon = normalizeOptionalText(icon, 50);
    }

    public void activate() {
        active = true;
    }

    public void deactivate() {
        active = false;
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

    private static String normalizeName(String value) {
        String normalized = Objects.requireNonNull(
                value,
                "Financial category name cannot be null"
        ).trim().replaceAll("\\s+", " ");

        if (normalized.length() < 2 || normalized.length() > 80) {
            throw new IllegalArgumentException(
                    "Financial category name must contain between 2 and 80 characters"
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

        String normalized = value.trim();

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

    public FinancialCategoryType getType() {
        return type;
    }

    public String getColor() {
        return color;
    }

    public String getIcon() {
        return icon;
    }

    public boolean isActive() {
        return active;
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