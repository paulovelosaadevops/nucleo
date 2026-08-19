package br.com.nucleo.api.finance.domain;

import br.com.nucleo.api.family.domain.Family;
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
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "financial_budgets")
public class FinancialBudget {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private FinancialCategory category;

    @Column(name = "reference_month", nullable = false)
    private LocalDate referenceMonth;

    @Column(
            name = "limit_amount",
            nullable = false,
            precision = 18,
            scale = 2
    )
    private BigDecimal limitAmount;

    @Column(
            name = "alert_percentage",
            nullable = false,
            precision = 5,
            scale = 2
    )
    private BigDecimal alertPercentage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected FinancialBudget() {
    }

    private FinancialBudget(
            Family family,
            FinancialCategory category,
            LocalDate referenceMonth,
            BigDecimal limitAmount,
            BigDecimal alertPercentage
    ) {
        this.family = Objects.requireNonNull(
                family,
                "Family cannot be null"
        );
        this.category = Objects.requireNonNull(
                category,
                "Category cannot be null"
        );
        this.referenceMonth = normalizeReferenceMonth(
                referenceMonth
        );
        this.limitAmount = validatePositiveMoney(limitAmount);
        this.alertPercentage = validateAlertPercentage(
                alertPercentage == null
                        ? BigDecimal.valueOf(80)
                        : alertPercentage
        );
    }

    public static FinancialBudget create(
            Family family,
            FinancialCategory category,
            LocalDate referenceMonth,
            BigDecimal limitAmount,
            BigDecimal alertPercentage
    ) {
        return new FinancialBudget(
                family,
                category,
                referenceMonth,
                limitAmount,
                alertPercentage
        );
    }

    public void update(
            BigDecimal limitAmount,
            BigDecimal alertPercentage
    ) {
        this.limitAmount = validatePositiveMoney(limitAmount);
        this.alertPercentage = validateAlertPercentage(
                alertPercentage
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

    private static LocalDate normalizeReferenceMonth(
            LocalDate value
    ) {
        return Objects.requireNonNull(
                value,
                "Reference month cannot be null"
        ).withDayOfMonth(1);
    }

    private static BigDecimal validatePositiveMoney(
            BigDecimal value
    ) {
        BigDecimal money = Objects.requireNonNull(
                value,
                "Budget limit cannot be null"
        );

        if (money.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Budget limit must be greater than zero"
            );
        }

        if (normalizedScale(money) > 2) {
            throw new IllegalArgumentException(
                    "Budget limit can contain at most 2 decimal places"
            );
        }

        if (money.precision() > 18) {
            throw new IllegalArgumentException(
                    "Budget limit is too large"
            );
        }

        return money;
    }

    private static BigDecimal validateAlertPercentage(
            BigDecimal value
    ) {
        BigDecimal percentage = Objects.requireNonNull(
                value,
                "Alert percentage cannot be null"
        );

        if (
                percentage.compareTo(BigDecimal.ONE) < 0
                        || percentage.compareTo(
                        BigDecimal.valueOf(100)
                ) > 0
        ) {
            throw new IllegalArgumentException(
                    "Alert percentage must be between 1 and 100"
            );
        }

        if (normalizedScale(percentage) > 2) {
            throw new IllegalArgumentException(
                    "Alert percentage can contain at most 2 decimal places"
            );
        }

        return percentage;
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

    public FinancialCategory getCategory() {
        return category;
    }

    public LocalDate getReferenceMonth() {
        return referenceMonth;
    }

    public BigDecimal getLimitAmount() {
        return limitAmount;
    }

    public BigDecimal getAlertPercentage() {
        return alertPercentage;
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