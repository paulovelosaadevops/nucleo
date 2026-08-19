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
import java.util.Objects;
import java.util.UUID;

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

    @Column(nullable = false, length = 160)
    private String description;

    @Column(
            name = "total_amount",
            nullable = false,
            precision = 18,
            scale = 2
    )
    private BigDecimal totalAmount;

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
            String description,
            BigDecimal totalAmount,
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
        this.description = normalizeDescription(description);
        this.totalAmount = validatePositiveMoney(totalAmount);
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
    }

    public static FinancialCreditCardPurchase create(
            Family family,
            FinancialCreditCard creditCard,
            FinancialCategory category,
            String description,
            BigDecimal totalAmount,
            LocalDate purchaseDate,
            int totalInstallments,
            String notes,
            User createdBy
    ) {
        return new FinancialCreditCardPurchase(
                family,
                creditCard,
                category,
                description,
                totalAmount,
                purchaseDate,
                totalInstallments,
                notes,
                createdBy
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
        if (status == FinancialCreditCardPurchaseStatus.CANCELLED) {
            throw new IllegalStateException(
                    "Credit card purchase is already cancelled"
            );
        }

        status = FinancialCreditCardPurchaseStatus.CANCELLED;
    }

    public void restore() {
        if (status != FinancialCreditCardPurchaseStatus.CANCELLED) {
            throw new IllegalStateException(
                    "Only a cancelled purchase can be restored"
            );
        }

        status = FinancialCreditCardPurchaseStatus.ACTIVE;
    }

    public boolean isActive() {
        return status == FinancialCreditCardPurchaseStatus.ACTIVE;
    }

    public boolean isCancelled() {
        return status == FinancialCreditCardPurchaseStatus.CANCELLED;
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
        Instant now = Instant.now();

        createdAt = now;
        updatedAt = now;

        if (status == null) {
            status = FinancialCreditCardPurchaseStatus.ACTIVE;
        }
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = Instant.now();
    }

    private static String normalizeDescription(String value) {
        String normalized = Objects.requireNonNull(
                value,
                "Purchase description cannot be null"
        ).trim().replaceAll("\\s+", " ");

        if (normalized.isEmpty() || normalized.length() > 160) {
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

    private static int normalizedScale(BigDecimal value) {
        return Math.max(value.stripTrailingZeros().scale(), 0);
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

    public String getDescription() {
        return description;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
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