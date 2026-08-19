package br.com.nucleo.api.finance;

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
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "financial_accounts")
public class FinancialAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FinancialAccountType type;

    @Column(
            name = "initial_balance",
            nullable = false,
            precision = 18,
            scale = 2
    )
    private BigDecimal initialBalance;

    @Column(length = 20)
    private String color;

    @Column(name = "include_in_total", nullable = false)
    private boolean includeInTotal;

    @Column(nullable = false)
    private boolean active;

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

    protected FinancialAccount() {
    }

    private FinancialAccount(
            Family family,
            String name,
            FinancialAccountType type,
            BigDecimal initialBalance,
            String color,
            boolean includeInTotal,
            User createdBy
    ) {
        this.family = Objects.requireNonNull(
                family,
                "Family cannot be null"
        );
        this.name = normalizeName(name);
        this.type = Objects.requireNonNull(
                type,
                "Financial account type cannot be null"
        );
        this.initialBalance = validateMoney(
                initialBalance == null
                        ? BigDecimal.ZERO
                        : initialBalance
        );
        this.color = normalizeOptionalText(color, 20);
        this.includeInTotal = includeInTotal;
        this.active = true;
        this.createdBy = Objects.requireNonNull(
                createdBy,
                "Account creator cannot be null"
        );
    }

    public static FinancialAccount create(
            Family family,
            String name,
            FinancialAccountType type,
            BigDecimal initialBalance,
            String color,
            boolean includeInTotal,
            User createdBy
    ) {
        return new FinancialAccount(
                family,
                name,
                type,
                initialBalance,
                color,
                includeInTotal,
                createdBy
        );
    }

    public void update(
            String name,
            FinancialAccountType type,
            String color,
            boolean includeInTotal
    ) {
        this.name = normalizeName(name);
        this.type = Objects.requireNonNull(
                type,
                "Financial account type cannot be null"
        );
        this.color = normalizeOptionalText(color, 20);
        this.includeInTotal = includeInTotal;
    }

    public void changeInitialBalance(
            BigDecimal newInitialBalance
    ) {
        initialBalance = validateMoney(
                Objects.requireNonNull(
                        newInitialBalance,
                        "Initial balance cannot be null"
                )
        );
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

        if (initialBalance == null) {
            initialBalance = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = Instant.now();
    }

    private static String normalizeName(String value) {
        String normalized = Objects.requireNonNull(
                value,
                "Financial account name cannot be null"
        ).trim().replaceAll("\\s+", " ");

        if (normalized.length() < 2 || normalized.length() > 120) {
            throw new IllegalArgumentException(
                    "Financial account name must contain between 2 and 120 characters"
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

    private static BigDecimal validateMoney(BigDecimal value) {
        if (normalizedScale(value) > 2) {
            throw new IllegalArgumentException(
                    "Money can contain at most 2 decimal places"
            );
        }

        if (value.precision() > 18) {
            throw new IllegalArgumentException(
                    "Money value is too large"
            );
        }

        return value;
    }

    private static int normalizedScale(BigDecimal value) {
        return Math.max(value.stripTrailingZeros().scale(), 0);
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

    public FinancialAccountType getType() {
        return type;
    }

    public BigDecimal getInitialBalance() {
        return initialBalance;
    }

    public String getColor() {
        return color;
    }

    public boolean isIncludeInTotal() {
        return includeInTotal;
    }

    public boolean isActive() {
        return active;
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