package br.com.nucleo.api.finance.domain;

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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "financial_credit_cards")
public class FinancialCreditCard {

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
    private FinancialCreditCardBrand brand;

    @Column(name = "last_four", length = 4)
    private String lastFour;

    @Column(
            name = "credit_limit",
            nullable = false,
            precision = 18,
            scale = 2
    )
    private BigDecimal creditLimit;

    @Column(name = "closing_day", nullable = false)
    private int closingDay;

    @Column(name = "due_day", nullable = false)
    private int dueDay;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_account_id")
    private FinancialAccount paymentAccount;

    @Column(length = 20)
    private String color;

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

    protected FinancialCreditCard() {
    }

    private FinancialCreditCard(
            Family family,
            String name,
            FinancialCreditCardBrand brand,
            String lastFour,
            BigDecimal creditLimit,
            int closingDay,
            int dueDay,
            FinancialAccount paymentAccount,
            String color,
            User createdBy
    ) {
        this.family = Objects.requireNonNull(
                family,
                "Family cannot be null"
        );
        this.name = normalizeName(name);
        this.brand = Objects.requireNonNull(
                brand,
                "Credit card brand cannot be null"
        );
        this.lastFour = normalizeLastFour(lastFour);
        this.creditLimit = validatePositiveMoney(
                creditLimit
        );
        this.closingDay = validateDay(
                closingDay,
                "Closing day"
        );
        this.dueDay = validateDay(
                dueDay,
                "Due day"
        );
        this.paymentAccount = paymentAccount;
        this.color = normalizeOptionalText(color, 20);
        this.createdBy = Objects.requireNonNull(
                createdBy,
                "Credit card creator cannot be null"
        );
        this.active = true;
    }

    public static FinancialCreditCard create(
            Family family,
            String name,
            FinancialCreditCardBrand brand,
            String lastFour,
            BigDecimal creditLimit,
            int closingDay,
            int dueDay,
            FinancialAccount paymentAccount,
            String color,
            User createdBy
    ) {
        return new FinancialCreditCard(
                family,
                name,
                brand,
                lastFour,
                creditLimit,
                closingDay,
                dueDay,
                paymentAccount,
                color,
                createdBy
        );
    }

    public void update(
            String name,
            FinancialCreditCardBrand brand,
            String lastFour,
            BigDecimal creditLimit,
            int closingDay,
            int dueDay,
            FinancialAccount paymentAccount,
            String color
    ) {
        this.name = normalizeName(name);
        this.brand = Objects.requireNonNull(
                brand,
                "Credit card brand cannot be null"
        );
        this.lastFour = normalizeLastFour(lastFour);
        this.creditLimit = validatePositiveMoney(
                creditLimit
        );
        this.closingDay = validateDay(
                closingDay,
                "Closing day"
        );
        this.dueDay = validateDay(
                dueDay,
                "Due day"
        );
        this.paymentAccount = paymentAccount;
        this.color = normalizeOptionalText(color, 20);
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
                "Credit card name cannot be null"
        ).trim().replaceAll("\\s+", " ");

        if (normalized.length() < 2 || normalized.length() > 120) {
            throw new IllegalArgumentException(
                    "Credit card name must contain between 2 and 120 characters"
            );
        }

        return normalized;
    }

    private static String normalizeLastFour(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim();

        if (!normalized.matches("\\d{4}")) {
            throw new IllegalArgumentException(
                    "Last four digits must contain exactly 4 numbers"
            );
        }

        return normalized;
    }

    private static int validateDay(
            int value,
            String fieldName
    ) {
        if (value < 1 || value > 28) {
            throw new IllegalArgumentException(
                    fieldName + " must be between 1 and 28"
            );
        }

        return value;
    }

    private static BigDecimal validatePositiveMoney(
            BigDecimal value
    ) {
        BigDecimal money = Objects.requireNonNull(
                value,
                "Credit limit cannot be null"
        );

        if (money.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Credit limit must be greater than zero"
            );
        }

        if (normalizedScale(money) > 2) {
            throw new IllegalArgumentException(
                    "Credit limit can contain at most 2 decimal places"
            );
        }

        if (money.precision() > 18) {
            throw new IllegalArgumentException(
                    "Credit limit is too large"
            );
        }

        return money;
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

    public FinancialCreditCardBrand getBrand() {
        return brand;
    }

    public String getLastFour() {
        return lastFour;
    }

    public BigDecimal getCreditLimit() {
        return creditLimit;
    }

    public int getClosingDay() {
        return closingDay;
    }

    public int getDueDay() {
        return dueDay;
    }

    public FinancialAccount getPaymentAccount() {
        return paymentAccount;
    }

    public String getColor() {
        return color;
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