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
@Table(name = "financial_credit_card_purchases")
public class FinancialCreditCardPurchase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "credit_card_id", nullable = false)
    private FinancialCreditCard creditCard;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private FinancialCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recurrence_id")
    private FinancialRecurrence recurrence;

    @Column(name = "recurrence_sequence")
    private Integer recurrenceSequence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_import_id")
    private FinancialInvoiceImport invoiceImport;

    @Column(name = "invoice_import_fingerprint", length = 64)
    private String invoiceImportFingerprint;

    @Column(nullable = false, length = 160)
    private String description;

    @Column(
            name = "total_amount",
            nullable = false,
            precision = 18,
            scale = 2
    )
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "purchase_type", nullable = false, length = 20)
    private FinancialCreditCardPurchaseType purchaseType;

    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate;

    @Column(name = "total_installments", nullable = false)
    private int totalInstallments;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FinancialCreditCardPurchaseStatus status;

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

    protected FinancialCreditCardPurchase() {
    }

    private FinancialCreditCardPurchase(
            Family family,
            FinancialCreditCard creditCard,
            FinancialCategory category,
            FinancialRecurrence recurrence,
            Integer recurrenceSequence,
            String description,
            BigDecimal totalAmount,
            FinancialCreditCardPurchaseType purchaseType,
            LocalDate purchaseDate,
            int totalInstallments,
            String notes,
            User createdBy
    ) {
        this.family = Objects.requireNonNull(
                family,
                "Family cannot be null"
        );
        this.creditCard = Objects.requireNonNull(
                creditCard,
                "Credit card cannot be null"
        );
        this.category = category;
        this.recurrence = recurrence;
        this.recurrenceSequence = recurrenceSequence;
        this.description = normalizeDescription(description);
        this.totalAmount = validatePositiveMoney(totalAmount);
        this.purchaseType = Objects.requireNonNullElse(
                purchaseType,
                FinancialCreditCardPurchaseType.DEBIT
        );
        this.purchaseDate = Objects.requireNonNull(
                purchaseDate,
                "Purchase date cannot be null"
        );
        this.totalInstallments =
                validateInstallmentCount(totalInstallments);
        this.notes = normalizeOptionalText(notes, 1000);
        this.createdBy = Objects.requireNonNull(
                createdBy,
                "Purchase creator cannot be null"
        );
        this.status = FinancialCreditCardPurchaseStatus.ACTIVE;

        validateRecurrenceOrigin();
    }

    public static FinancialCreditCardPurchase create(
            Family family,
            FinancialCreditCard creditCard,
            FinancialCategory category,
            String description,
            BigDecimal totalAmount,
            FinancialCreditCardPurchaseType purchaseType,
            LocalDate purchaseDate,
            int totalInstallments,
            String notes,
            User createdBy
    ) {
        return new FinancialCreditCardPurchase(
                family,
                creditCard,
                category,
                null,
                null,
                description,
                totalAmount,
                purchaseType,
                purchaseDate,
                totalInstallments,
                notes,
                createdBy
        );
    }

    public static FinancialCreditCardPurchase createFromRecurrence(
            FinancialRecurrence recurrence,
            int recurrenceSequence,
            LocalDate purchaseDate
    ) {
        return createFromRecurrence(
                recurrence,
                recurrenceSequence,
                purchaseDate,
                recurrence.getAmount(),
                recurrence.getCategory(),
                recurrence.getCreditCard(),
                recurrence.getNotes()
        );
    }

    public static FinancialCreditCardPurchase createFromRecurrence(
            FinancialRecurrence recurrence,
            int recurrenceSequence,
            LocalDate purchaseDate,
            BigDecimal amount,
            FinancialCategory category,
            FinancialCreditCard creditCard,
            String notes
    ) {
        FinancialRecurrence source = Objects.requireNonNull(
                recurrence,
                "Recurrence cannot be null"
        );

        if (
                source.getPaymentMethod()
                        != FinancialPaymentMethod.CREDIT_CARD
        ) {
            throw new IllegalArgumentException(
                    "Recurrence is not configured for a credit card"
            );
        }

        if (source.getCreditCard() == null) {
            throw new IllegalArgumentException(
                    "Credit card recurrence must have a credit card"
            );
        }

        return new FinancialCreditCardPurchase(
                source.getFamily(),
                creditCard,
                category,
                source,
                recurrenceSequence,
                source.getDescription(),
                amount,
                FinancialCreditCardPurchaseType.DEBIT,
                purchaseDate,
                1,
                notes,
                source.getCreatedBy()
        );
    }

    public void updateDetails(
            FinancialCategory category,
            String description,
            String notes
    ) {
        ensureActive();

        this.category = category;
        this.description = normalizeDescription(description);
        this.notes = normalizeOptionalText(notes, 1000);
    }

    public void cancel() {
        if (
                status
                        == FinancialCreditCardPurchaseStatus.CANCELLED
        ) {
            throw new IllegalStateException(
                    "Credit card purchase is already cancelled"
            );
        }

        status = FinancialCreditCardPurchaseStatus.CANCELLED;
    }

    public void restore() {
        if (
                status
                        != FinancialCreditCardPurchaseStatus.CANCELLED
        ) {
            throw new IllegalStateException(
                    "Only a cancelled purchase can be restored"
            );
        }

        status = FinancialCreditCardPurchaseStatus.ACTIVE;
    }

    public boolean isActive() {
        return status
                == FinancialCreditCardPurchaseStatus.ACTIVE;
    }

    public boolean isCancelled() {
        return status
                == FinancialCreditCardPurchaseStatus.CANCELLED;
    }

    public boolean isGeneratedFromRecurrence() {
        return recurrence != null;
    }

    public void markImported(
            FinancialInvoiceImport invoiceImport,
            String fingerprint
    ) {
        this.invoiceImport = Objects.requireNonNull(invoiceImport);
        this.invoiceImportFingerprint = Objects.requireNonNull(fingerprint);
    }

    private void ensureActive() {
        if (!isActive()) {
            throw new IllegalStateException(
                    "Cancelled purchase cannot be changed"
            );
        }
    }

    @PrePersist
    private void onCreate() {
        validateRecurrenceOrigin();

        Instant now = Instant.now();

        createdAt = now;
        updatedAt = now;

        if (status == null) {
            status =
                    FinancialCreditCardPurchaseStatus.ACTIVE;
        }

        if (purchaseType == null) {
            purchaseType = FinancialCreditCardPurchaseType.DEBIT;
        }
    }

    @PreUpdate
    private void onUpdate() {
        validateRecurrenceOrigin();
        updatedAt = Instant.now();
    }

    private void validateRecurrenceOrigin() {
        if (
                recurrence == null
                        && recurrenceSequence != null
        ) {
            throw new IllegalStateException(
                    "Purchase without recurrence cannot have a sequence"
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
                    "Recurring purchase must have a valid sequence"
            );
        }

        if (
                recurrence != null
                        && recurrence.getPaymentMethod()
                        != FinancialPaymentMethod.CREDIT_CARD
        ) {
            throw new IllegalStateException(
                    "Recurring purchase requires a credit card recurrence"
            );
        }
    }

    private static String normalizeDescription(String value) {
        String normalized = Objects.requireNonNull(
                value,
                "Purchase description cannot be null"
        ).trim().replaceAll("\\s+", " ");

        if (
                normalized.isEmpty()
                        || normalized.length() > 160
        ) {
            throw new IllegalArgumentException(
                    "Purchase description must contain between 1 and 160 characters"
            );
        }

        return normalized;
    }

    private static int validateInstallmentCount(int value) {
        if (value < 1 || value > 120) {
            throw new IllegalArgumentException(
                    "Installment count must be between 1 and 120"
            );
        }

        return value;
    }

    private static BigDecimal validatePositiveMoney(
            BigDecimal value
    ) {
        BigDecimal money = Objects.requireNonNull(
                value,
                "Purchase amount cannot be null"
        );

        if (money.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Purchase amount must be greater than zero"
            );
        }

        if (normalizedScale(money) > 2) {
            throw new IllegalArgumentException(
                    "Purchase amount can contain at most 2 decimal places"
            );
        }

        if (money.precision() > 18) {
            throw new IllegalArgumentException(
                    "Purchase amount is too large"
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

        String normalized = value
                .trim()
                .replaceAll("\\s+", " ");

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
        return Math.max(
                value.stripTrailingZeros().scale(),
                0
        );
    }

    public UUID getId() {
        return id;
    }

    public Family getFamily() {
        return family;
    }

    public FinancialCreditCard getCreditCard() {
        return creditCard;
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

    public FinancialInvoiceImport getInvoiceImport() {
        return invoiceImport;
    }

    public String getInvoiceImportFingerprint() {
        return invoiceImportFingerprint;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public FinancialCreditCardPurchaseType getPurchaseType() {
        return purchaseType;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public int getTotalInstallments() {
        return totalInstallments;
    }

    public FinancialCreditCardPurchaseStatus getStatus() {
        return status;
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
