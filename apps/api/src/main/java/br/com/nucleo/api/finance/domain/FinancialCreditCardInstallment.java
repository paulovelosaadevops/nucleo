package br.com.nucleo.api.finance.domain;

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
@Table(name = "financial_credit_card_installments")
public class FinancialCreditCardInstallment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_id", nullable = false)
    private FinancialCreditCardPurchase purchase;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false)
    private FinancialCreditCardInvoice invoice;

    @Column(name = "installment_number", nullable = false)
    private int installmentNumber;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FinancialCreditCardInstallmentStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected FinancialCreditCardInstallment() {
    }

    private FinancialCreditCardInstallment(
            FinancialCreditCardPurchase purchase,
            FinancialCreditCardInvoice invoice,
            int installmentNumber,
            BigDecimal amount
    ) {
        this.purchase = Objects.requireNonNull(
                purchase,
                "Purchase cannot be null"
        );
        this.invoice = Objects.requireNonNull(
                invoice,
                "Invoice cannot be null"
        );
        this.installmentNumber =
                validateInstallmentNumber(installmentNumber);
        this.amount = validatePositiveMoney(amount);
        this.status = FinancialCreditCardInstallmentStatus.OPEN;
    }

    public static FinancialCreditCardInstallment create(
            FinancialCreditCardPurchase purchase,
            FinancialCreditCardInvoice invoice,
            int installmentNumber,
            BigDecimal amount
    ) {
        return new FinancialCreditCardInstallment(
                purchase,
                invoice,
                installmentNumber,
                amount
        );
    }

    public void cancel() {
        if (status == FinancialCreditCardInstallmentStatus.CANCELLED) {
            return;
        }

        status = FinancialCreditCardInstallmentStatus.CANCELLED;
    }

    public void restore() {
        if (status != FinancialCreditCardInstallmentStatus.CANCELLED) {
            return;
        }

        status = FinancialCreditCardInstallmentStatus.OPEN;
    }

    public boolean isOpen() {
        return status == FinancialCreditCardInstallmentStatus.OPEN;
    }

    public boolean isCancelled() {
        return status == FinancialCreditCardInstallmentStatus.CANCELLED;
    }

    public boolean isPaid() {
        return isOpen() && invoice.isPaid();
    }

    @PrePersist
    private void onCreate() {
        Instant now = Instant.now();

        createdAt = now;
        updatedAt = now;

        if (status == null) {
            status = FinancialCreditCardInstallmentStatus.OPEN;
        }
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = Instant.now();
    }

    private static int validateInstallmentNumber(int value) {
        if (value < 1) {
            throw new IllegalArgumentException(
                    "Installment number must be greater than zero"
            );
        }

        return value;
    }

    private static BigDecimal validatePositiveMoney(
            BigDecimal value
    ) {
        BigDecimal money = Objects.requireNonNull(
                value,
                "Installment amount cannot be null"
        );

        if (money.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Installment amount must be greater than zero"
            );
        }

        if (normalizedScale(money) > 2) {
            throw new IllegalArgumentException(
                    "Installment amount can contain at most 2 decimal places"
            );
        }

        if (money.precision() > 18) {
            throw new IllegalArgumentException(
                    "Installment amount is too large"
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

    public FinancialCreditCardPurchase getPurchase() {
        return purchase;
    }

    public FinancialCreditCardInvoice getInvoice() {
        return invoice;
    }

    public int getInstallmentNumber() {
        return installmentNumber;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public BigDecimal getSignedAmount() {
        return FinancialCreditCardInvoiceAmounts.signedAmount(
                purchase.getPurchaseType(),
                amount
        );
    }

    public FinancialCreditCardInstallmentStatus getStatus() {
        return status;
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
