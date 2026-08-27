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
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "financial_recurrence_occurrences")
public class FinancialRecurrenceOccurrence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recurrence_id", nullable = false)
    private FinancialRecurrence recurrence;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @Column(name = "reference_month", nullable = false)
    private LocalDate referenceMonth;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "reminder_date")
    private LocalDate reminderDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FinancialRecurrenceOccurrenceStatus status;

    @Column(name = "estimated_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal estimatedAmount;

    @Column(name = "confirmed_amount", precision = 18, scale = 2)
    private BigDecimal confirmedAmount;

    @Column(name = "confirmed_date")
    private LocalDate confirmedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private FinancialCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private FinancialAccount account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_card_id")
    private FinancialCreditCard creditCard;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id")
    private FinancialTransaction transaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_id")
    private FinancialCreditCardPurchase purchase;

    @Column(length = 1000)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_by_user_id")
    private User confirmedBy;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected FinancialRecurrenceOccurrence() {
    }

    public static FinancialRecurrenceOccurrence create(FinancialRecurrence recurrence, LocalDate scheduledDate) {
        FinancialRecurrence source = Objects.requireNonNull(recurrence);
        FinancialRecurrenceOccurrence occurrence = new FinancialRecurrenceOccurrence();
        occurrence.recurrence = source;
        occurrence.family = source.getFamily();
        occurrence.referenceMonth = YearMonth.from(scheduledDate).atDay(1);
        occurrence.scheduledDate = Objects.requireNonNull(scheduledDate);
        occurrence.reminderDate = scheduledDate;
        occurrence.status = FinancialRecurrenceOccurrenceStatus.AWAITING_CONFIRMATION;
        occurrence.estimatedAmount = source.getAmount();
        occurrence.category = source.getCategory();
        occurrence.account = source.getAccount();
        occurrence.creditCard = source.getCreditCard();
        return occurrence;
    }

    public void confirm(
            BigDecimal amount,
            LocalDate date,
            FinancialCategory category,
            FinancialAccount account,
            FinancialCreditCard creditCard,
            FinancialTransaction transaction,
            FinancialCreditCardPurchase purchase,
            String notes,
            User user
    ) {
        ensurePending();
        confirmedAmount = validatePositiveMoney(amount);
        confirmedDate = Objects.requireNonNull(date);
        this.category = category;
        this.account = account;
        this.creditCard = creditCard;
        this.transaction = transaction;
        this.purchase = purchase;
        this.notes = normalizeOptionalText(notes, 1000);
        confirmedBy = Objects.requireNonNull(user);
        confirmedAt = Instant.now();
        status = FinancialRecurrenceOccurrenceStatus.CONFIRMED;
    }

    public void skip(String notes) {
        ensurePending();
        this.notes = normalizeOptionalText(notes, 1000);
        status = FinancialRecurrenceOccurrenceStatus.SKIPPED;
    }

    public void postpone(LocalDate reminderDate) {
        ensurePending();
        this.reminderDate = Objects.requireNonNull(reminderDate);
    }

    public void markOverdue(LocalDate today) {
        if (status == FinancialRecurrenceOccurrenceStatus.AWAITING_CONFIRMATION
                && scheduledDate.isBefore(today)) {
            status = FinancialRecurrenceOccurrenceStatus.OVERDUE;
        }
    }

    public boolean isConfirmed() {
        return status == FinancialRecurrenceOccurrenceStatus.CONFIRMED;
    }

    private void ensurePending() {
        if (status != FinancialRecurrenceOccurrenceStatus.AWAITING_CONFIRMATION
                && status != FinancialRecurrenceOccurrenceStatus.OVERDUE) {
            throw new IllegalStateException("Ocorrencia recorrente ja finalizada");
        }
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

    private static BigDecimal validatePositiveMoney(BigDecimal value) {
        BigDecimal money = Objects.requireNonNull(value);
        if (money.compareTo(BigDecimal.ZERO) <= 0 || Math.max(money.stripTrailingZeros().scale(), 0) > 2) {
            throw new IllegalArgumentException("Valor deve ser maior que zero e possuir ate 2 casas decimais");
        }
        return money;
    }

    private static String normalizeOptionalText(String value, int maximumLength) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().replaceAll("\\s+", " ");
        if (normalized.length() > maximumLength) {
            throw new IllegalArgumentException("Texto muito longo");
        }
        return normalized;
    }

    public UUID getId() { return id; }
    public FinancialRecurrence getRecurrence() { return recurrence; }
    public Family getFamily() { return family; }
    public LocalDate getReferenceMonth() { return referenceMonth; }
    public LocalDate getScheduledDate() { return scheduledDate; }
    public LocalDate getReminderDate() { return reminderDate; }
    public FinancialRecurrenceOccurrenceStatus getStatus() { return status; }
    public BigDecimal getEstimatedAmount() { return estimatedAmount; }
    public BigDecimal getConfirmedAmount() { return confirmedAmount; }
    public LocalDate getConfirmedDate() { return confirmedDate; }
    public FinancialCategory getCategory() { return category; }
    public FinancialAccount getAccount() { return account; }
    public FinancialCreditCard getCreditCard() { return creditCard; }
    public FinancialTransaction getTransaction() { return transaction; }
    public FinancialCreditCardPurchase getPurchase() { return purchase; }
    public String getNotes() { return notes; }
    public User getConfirmedBy() { return confirmedBy; }
    public Instant getConfirmedAt() { return confirmedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public long getVersion() { return version; }
}
