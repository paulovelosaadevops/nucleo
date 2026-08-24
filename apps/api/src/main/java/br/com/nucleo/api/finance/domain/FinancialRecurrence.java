package br.com.nucleo.api.finance.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

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

@Entity
@Table(name = "financial_recurrences")
public class FinancialRecurrence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private FinancialAccount account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_card_id")
    private FinancialCreditCard creditCard;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private FinancialCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FinancialTransactionType type;

    @Column(nullable = false, length = 160)
    private String description;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FinancialRecurrenceFrequency frequency;

    @Column(name = "recurrence_interval", nullable = false)
    private int interval;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "next_generation_date", nullable = false)
    private LocalDate nextGenerationDate;

    @Column(name = "remaining_occurrences")
    private Integer remainingOccurrences;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 30)
    private FinancialPaymentMethod paymentMethod;

    @Column(length = 1000)
    private String notes;

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

    protected FinancialRecurrence() {
    }

    private FinancialRecurrence(
            Family family,
            FinancialAccount account,
            FinancialCreditCard creditCard,
            FinancialCategory category,
            FinancialTransactionType type,
            String description,
            BigDecimal amount,
            FinancialRecurrenceFrequency frequency,
            int interval,
            LocalDate startDate,
            LocalDate endDate,
            Integer occurrenceCount,
            FinancialPaymentMethod paymentMethod,
            String notes,
            User createdBy
    ) {
        this.family = Objects.requireNonNull(
                family,
                "Family cannot be null"
        );

        validateSource(
                account,
                creditCard,
                type,
                paymentMethod
        );

        this.account = account;
        this.creditCard = creditCard;
        this.category = category;
        this.type = Objects.requireNonNull(
                type,
                "Transaction type cannot be null"
        );
        this.description = normalizeDescription(description);
        this.amount = validatePositiveMoney(amount);
        this.frequency = Objects.requireNonNull(
                frequency,
                "Recurrence frequency cannot be null"
        );
        this.interval = validateInterval(interval);
        this.startDate = Objects.requireNonNull(
                startDate,
                "Start date cannot be null"
        );
        this.endDate = endDate;
        this.remainingOccurrences =
                validateOccurrenceCount(occurrenceCount);
        this.paymentMethod = paymentMethod;
        this.notes = normalizeOptionalText(notes, 1000);
        this.createdBy = Objects.requireNonNull(
                createdBy,
                "Recurrence creator cannot be null"
        );
        this.nextGenerationDate = startDate;
        this.active = true;

        validatePeriod(startDate, endDate);
    }

    public static FinancialRecurrence create(
            Family family,
            FinancialAccount account,
            FinancialCreditCard creditCard,
            FinancialCategory category,
            FinancialTransactionType type,
            String description,
            BigDecimal amount,
            FinancialRecurrenceFrequency frequency,
            int interval,
            LocalDate startDate,
            LocalDate endDate,
            Integer occurrenceCount,
            FinancialPaymentMethod paymentMethod,
            String notes,
            User createdBy
    ) {
        return new FinancialRecurrence(
                family,
                account,
                creditCard,
                category,
                type,
                description,
                amount,
                frequency,
                interval,
                startDate,
                endDate,
                occurrenceCount,
                paymentMethod,
                notes,
                createdBy
        );
    }

    public void update(
            FinancialAccount account,
            FinancialCreditCard creditCard,
            FinancialCategory category,
            FinancialTransactionType type,
            String description,
            BigDecimal amount,
            FinancialPaymentMethod paymentMethod,
            String notes
    ) {
        validateSource(
                account,
                creditCard,
                type,
                paymentMethod
        );

        this.account = account;
        this.creditCard = creditCard;
        this.category = category;
        this.type = Objects.requireNonNull(
                type,
                "Transaction type cannot be null"
        );
        this.description = normalizeDescription(description);
        this.amount = validatePositiveMoney(amount);
        this.paymentMethod = paymentMethod;
        this.notes = normalizeOptionalText(notes, 1000);
    }

    public void pause() {
        active = false;
    }

    public void resume() {
        if (
                remainingOccurrences != null
                        && remainingOccurrences == 0
        ) {
            throw new IllegalStateException(
                    "Finished recurrence cannot be resumed"
            );
        }

        if (
                endDate != null
                        && nextGenerationDate.isAfter(endDate)
        ) {
            throw new IllegalStateException(
                    "Expired recurrence cannot be resumed"
            );
        }

        active = true;
    }

    public boolean canGenerateOnOrBefore(LocalDate limitDate) {
        if (!active) {
            return false;
        }

        if (nextGenerationDate.isAfter(limitDate)) {
            return false;
        }

        if (
                endDate != null
                        && nextGenerationDate.isAfter(endDate)
        ) {
            return false;
        }

        return remainingOccurrences == null
                || remainingOccurrences > 0;
    }

    public void advanceAfterGeneration() {
        if (!active) {
            throw new IllegalStateException(
                    "Inactive recurrence cannot be advanced"
            );
        }

        if (remainingOccurrences != null) {
            remainingOccurrences--;

            if (remainingOccurrences == 0) {
                active = false;
                return;
            }
        }

        nextGenerationDate = calculateNextDate(
                nextGenerationDate
        );

        if (
                endDate != null
                        && nextGenerationDate.isAfter(endDate)
        ) {
            active = false;
        }
    }

    private LocalDate calculateNextDate(LocalDate currentDate) {
        return switch (frequency) {
            case DAILY -> currentDate.plusDays(interval);
            case WEEKLY -> currentDate.plusWeeks(interval);
            case MONTHLY -> currentDate.plusMonths(interval);
            case YEARLY -> currentDate.plusYears(interval);
        };
    }

    @PrePersist
    private void onCreate() {
        validateSource(
                account,
                creditCard,
                type,
                paymentMethod
        );

        Instant now = Instant.now();

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    private void onUpdate() {
        validateSource(
                account,
                creditCard,
                type,
                paymentMethod
        );

        updatedAt = Instant.now();
    }

    private static void validateSource(
            FinancialAccount account,
            FinancialCreditCard creditCard,
            FinancialTransactionType type,
            FinancialPaymentMethod paymentMethod
    ) {
        Objects.requireNonNull(
                type,
                "Transaction type cannot be null"
        );

        boolean creditCardRecurrence =
                paymentMethod == FinancialPaymentMethod.CREDIT_CARD;

        if (creditCardRecurrence) {
            if (type != FinancialTransactionType.EXPENSE) {
                throw new IllegalArgumentException(
                        "Credit card recurrence must be an expense"
                );
            }

            if (account != null) {
                throw new IllegalArgumentException(
                        "Credit card recurrence cannot have a financial account"
                );
            }

            if (creditCard == null) {
                throw new IllegalArgumentException(
                        "Credit card recurrence must have a credit card"
                );
            }

            return;
        }

        if (account == null) {
            throw new IllegalArgumentException(
                    "Bank recurrence must have a financial account"
            );
        }

        if (creditCard != null) {
            throw new IllegalArgumentException(
                    "Bank recurrence cannot have a credit card"
            );
        }
    }

    private static void validatePeriod(
            LocalDate startDate,
            LocalDate endDate
    ) {
        if (
                endDate != null
                        && endDate.isBefore(startDate)
        ) {
            throw new IllegalArgumentException(
                    "End date cannot be before start date"
            );
        }
    }

    private static int validateInterval(int value) {
        if (value < 1 || value > 365) {
            throw new IllegalArgumentException(
                    "Recurrence interval must be between 1 and 365"
            );
        }

        return value;
    }

    private static Integer validateOccurrenceCount(
            Integer value
    ) {
        if (value != null && value < 1) {
            throw new IllegalArgumentException(
                    "Occurrence count must be greater than zero"
            );
        }

        return value;
    }

    private static String normalizeDescription(String value) {
        String normalized = Objects.requireNonNull(
                value,
                "Description cannot be null"
        ).trim().replaceAll("\\s+", " ");

        if (normalized.isEmpty() || normalized.length() > 160) {
            throw new IllegalArgumentException(
                    "Description must contain between 1 and 160 characters"
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

    private static BigDecimal validatePositiveMoney(
            BigDecimal value
    ) {
        BigDecimal money = Objects.requireNonNull(
                value,
                "Amount cannot be null"
        );

        if (money.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Amount must be greater than zero"
            );
        }

        if (normalizedScale(money) > 2) {
            throw new IllegalArgumentException(
                    "Amount can contain at most 2 decimal places"
            );
        }

        if (money.precision() > 18) {
            throw new IllegalArgumentException(
                    "Amount is too large"
            );
        }

        return money;
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

    public FinancialAccount getAccount() {
        return account;
    }

    public FinancialCreditCard getCreditCard() {
        return creditCard;
    }

    public FinancialCategory getCategory() {
        return category;
    }

    public FinancialTransactionType getType() {
        return type;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public FinancialRecurrenceFrequency getFrequency() {
        return frequency;
    }

    public int getInterval() {
        return interval;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public LocalDate getNextGenerationDate() {
        return nextGenerationDate;
    }

    public Integer getRemainingOccurrences() {
        return remainingOccurrences;
    }

    public FinancialPaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public String getNotes() {
        return notes;
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