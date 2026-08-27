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
import java.time.format.DateTimeFormatter;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "financial_transactions")
public class FinancialTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private FinancialAccount account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private FinancialCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recurrence_id")
    private FinancialRecurrence recurrence;

    @Column(name = "recurrence_sequence")
    private Integer recurrenceSequence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_card_invoice_id")
    private FinancialCreditCardInvoice creditCardInvoice;

    @Column(name = "exclude_from_reports", nullable = false)
    private boolean excludedFromReports;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FinancialTransactionType type;

    @Column(nullable = false, length = 160)
    private String description;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FinancialTransactionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 30)
    private FinancialPaymentMethod paymentMethod;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(length = 1000)
    private String notes;

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

    protected FinancialTransaction() {
    }

    private FinancialTransaction(
            Family family,
            FinancialAccount account,
            FinancialCategory category,
            FinancialRecurrence recurrence,
            Integer recurrenceSequence,
            FinancialCreditCardInvoice creditCardInvoice,
            boolean excludedFromReports,
            FinancialTransactionType type,
            String description,
            BigDecimal amount,
            LocalDate transactionDate,
            LocalDate dueDate,
            FinancialTransactionStatus status,
            FinancialPaymentMethod paymentMethod,
            User createdBy,
            String notes
    ) {
        this.family = Objects.requireNonNull(family);
        this.account = Objects.requireNonNull(account);
        this.category = category;
        this.recurrence = recurrence;
        this.recurrenceSequence = recurrenceSequence;
        this.creditCardInvoice = creditCardInvoice;
        this.excludedFromReports = excludedFromReports;
        this.type = Objects.requireNonNull(type);
        this.description = normalizeDescription(description);
        this.amount = validatePositiveMoney(amount);
        this.transactionDate = Objects.requireNonNull(transactionDate);
        this.dueDate = dueDate;
        this.status = status == null
                ? FinancialTransactionStatus.PENDING
                : status;
        this.paymentMethod = paymentMethod;
        this.createdBy = Objects.requireNonNull(createdBy);
        this.notes = normalizeOptionalText(notes, 1000);

        validateOrigins();
        normalizePaidState();
    }

    public static FinancialTransaction create(
            Family family,
            FinancialAccount account,
            FinancialCategory category,
            FinancialTransactionType type,
            String description,
            BigDecimal amount,
            LocalDate transactionDate,
            LocalDate dueDate,
            FinancialTransactionStatus status,
            FinancialPaymentMethod paymentMethod,
            User createdBy,
            String notes
    ) {
        return new FinancialTransaction(
                family,
                account,
                category,
                null,
                null,
                null,
                false,
                type,
                description,
                amount,
                transactionDate,
                dueDate,
                status,
                paymentMethod,
                userOrThrow(createdBy),
                notes
        );
    }

    public static FinancialTransaction createFromRecurrence(
            FinancialRecurrence recurrence,
            int sequence,
            LocalDate generationDate
    ) {
        return createFromRecurrence(
                recurrence,
                sequence,
                generationDate,
                recurrence.getAmount(),
                recurrence.getCategory(),
                recurrence.getAccount(),
                recurrence.getPaymentMethod(),
                recurrence.getNotes()
        );
    }

    public static FinancialTransaction createFromRecurrence(
            FinancialRecurrence recurrence,
            int sequence,
            LocalDate generationDate,
            BigDecimal amount,
            FinancialCategory category,
            FinancialAccount account,
            FinancialPaymentMethod paymentMethod,
            String notes
    ) {
        FinancialRecurrence source =
                Objects.requireNonNull(recurrence);

        if (sequence < 1) {
            throw new IllegalArgumentException(
                    "Recurrence sequence must be greater than zero"
            );
        }

        return new FinancialTransaction(
                source.getFamily(),
                account,
                category,
                source,
                sequence,
                null,
                false,
                source.getType(),
                source.getDescription(),
                amount,
                generationDate,
                generationDate,
                FinancialTransactionStatus.PENDING,
                paymentMethod,
                source.getCreatedBy(),
                notes
        );
    }

    public static FinancialTransaction createInvoicePayment(
            FinancialCreditCardInvoice invoice,
            FinancialAccount account,
            BigDecimal amount,
            LocalDate paymentDate,
            FinancialPaymentMethod paymentMethod,
            User createdBy
    ) {
        FinancialCreditCardInvoice source =
                Objects.requireNonNull(invoice);

        String reference = source
                .getReferenceMonth()
                .format(DateTimeFormatter.ofPattern("MM/yyyy"));

        return new FinancialTransaction(
                source.getCreditCard().getFamily(),
                account,
                null,
                null,
                null,
                source,
                true,
                FinancialTransactionType.EXPENSE,
                "Pagamento da fatura "
                        + source.getCreditCard().getName()
                        + " - "
                        + reference,
                amount,
                paymentDate,
                source.getDueDate(),
                FinancialTransactionStatus.PAID,
                paymentMethod,
                createdBy,
                "Pagamento de fatura de cartão de crédito"
        );
    }

    public void update(
            FinancialAccount account,
            FinancialCategory category,
            FinancialTransactionType type,
            String description,
            BigDecimal amount,
            LocalDate transactionDate,
            LocalDate dueDate,
            FinancialPaymentMethod paymentMethod,
            String notes
    ) {
        ensureRegularTransaction();
        ensureNotCancelled();

        this.account = Objects.requireNonNull(account);
        this.category = category;
        this.type = Objects.requireNonNull(type);
        this.description = normalizeDescription(description);
        this.amount = validatePositiveMoney(amount);
        this.transactionDate = Objects.requireNonNull(transactionDate);
        this.dueDate = dueDate;
        this.paymentMethod = paymentMethod;
        this.notes = normalizeOptionalText(notes, 1000);
    }

    public void markAsPaid() {
        ensureRegularTransaction();

        if (isCancelled()) {
            throw new IllegalStateException(
                    "Cancelled transaction cannot be paid"
            );
        }

        status = FinancialTransactionStatus.PAID;
        paidAt = Instant.now();
    }

    public void markAsPending() {
        ensureRegularTransaction();

        if (isCancelled()) {
            throw new IllegalStateException(
                    "Cancelled transaction cannot become pending"
            );
        }

        status = FinancialTransactionStatus.PENDING;
        paidAt = null;
    }

    public void cancel() {
        ensureRegularTransaction();

        status = FinancialTransactionStatus.CANCELLED;
        paidAt = null;
    }

    public void restore() {
        ensureRegularTransaction();

        if (!isCancelled()) {
            throw new IllegalStateException(
                    "Only cancelled transactions can be restored"
            );
        }

        status = FinancialTransactionStatus.PENDING;
        paidAt = null;
    }

    public boolean isPaid() {
        return status == FinancialTransactionStatus.PAID;
    }

    public boolean isPending() {
        return status == FinancialTransactionStatus.PENDING;
    }

    public boolean isCancelled() {
        return status == FinancialTransactionStatus.CANCELLED;
    }

    public boolean isGeneratedFromRecurrence() {
        return recurrence != null;
    }

    public boolean isInvoicePayment() {
        return creditCardInvoice != null;
    }

    @PrePersist
    private void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;

        if (status == null) {
            status = FinancialTransactionStatus.PENDING;
        }

        validateOrigins();
        normalizePaidState();
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = Instant.now();
        validateOrigins();
        normalizePaidState();
    }

    private void validateOrigins() {
        if (recurrence == null && recurrenceSequence != null) {
            throw new IllegalStateException(
                    "Transaction without recurrence cannot have a sequence"
            );
        }

        if (
                recurrence != null
                        && (
                        recurrenceSequence == null
                                || recurrenceSequence < 1
                )
        ) {
            throw new IllegalStateException(
                    "Recurring transaction must have a valid sequence"
            );
        }

        if (
                recurrence != null
                        && creditCardInvoice != null
        ) {
            throw new IllegalStateException(
                    "Transaction cannot have multiple origins"
            );
        }

        if (
                creditCardInvoice != null
                        && !excludedFromReports
        ) {
            throw new IllegalStateException(
                    "Invoice payment must be excluded from reports"
            );
        }
    }

    private void ensureRegularTransaction() {
        if (isInvoicePayment()) {
            throw new IllegalStateException(
                    "Invoice payment must be managed through the invoice"
            );
        }
    }

    private void normalizePaidState() {
        if (
                status == FinancialTransactionStatus.PAID
                        && paidAt == null
        ) {
            paidAt = Instant.now();
        }

        if (status != FinancialTransactionStatus.PAID) {
            paidAt = null;
        }
    }

    private void ensureNotCancelled() {
        if (isCancelled()) {
            throw new IllegalStateException(
                    "Cancelled transaction cannot be changed"
            );
               }
    }

    private static User userOrThrow(User user) {
        return Objects.requireNonNull(
                user,
                "Transaction creator cannot be null"
        );
    }

    private static String normalizeDescription(String value) {
        String normalized = Objects.requireNonNull(
                value,
                "Transaction description cannot be null"
        ).trim().replaceAll("\\s+", " ");

        if (normalized.isEmpty() || normalized.length() > 160) {
            throw new IllegalArgumentException(
                    "Transaction description must contain between 1 and 160 characters"
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
                "Transaction amount cannot be null"
        );

        if (money.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Transaction amount must be greater than zero"
            );
        }

        if (normalizedScale(money) > 2) {
            throw new IllegalArgumentException(
                    "Money can contain at most 2 decimal places"
            );
        }

        if (money.precision() > 18) {
            throw new IllegalArgumentException(
                    "Money value is too large"
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

    public FinancialCategory getCategory() {
        return category;
    }

    public FinancialRecurrence getRecurrence() {
        return recurrence;
    }

    public Integer getRecurrenceSequence() {
        return recurrenceSequence;
    }

    public FinancialCreditCardInvoice getCreditCardInvoice() {
        return creditCardInvoice;
    }

    public boolean isExcludedFromReports() {
        return excludedFromReports;
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

    public LocalDate getTransactionDate() {
        return transactionDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public FinancialTransactionStatus getStatus() {
        return status;
    }

    public FinancialPaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public String getNotes() {
        return notes;
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
