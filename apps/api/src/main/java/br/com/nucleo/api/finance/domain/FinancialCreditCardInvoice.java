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
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "financial_credit_card_invoices")
public class FinancialCreditCardInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "credit_card_id", nullable = false)
    private FinancialCreditCard creditCard;

    @Column(name = "reference_month", nullable = false)
    private LocalDate referenceMonth;

    @Column(name = "closing_date", nullable = false)
    private LocalDate closingDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FinancialCreditCardInvoiceStatus status;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected FinancialCreditCardInvoice() {
    }

    private FinancialCreditCardInvoice(
            FinancialCreditCard creditCard,
            LocalDate referenceMonth,
            LocalDate closingDate,
            LocalDate dueDate
    ) {
        this.creditCard = Objects.requireNonNull(
                creditCard,
                "Credit card cannot be null"
        );
        this.referenceMonth = normalizeMonth(referenceMonth);
        this.closingDate = Objects.requireNonNull(
                closingDate,
                "Closing date cannot be null"
        );
        this.dueDate = Objects.requireNonNull(
                dueDate,
                "Due date cannot be null"
        );
        this.status = FinancialCreditCardInvoiceStatus.OPEN;

        validateDates(closingDate, dueDate);
    }

    public static FinancialCreditCardInvoice create(
            FinancialCreditCard creditCard,
            LocalDate referenceMonth,
            LocalDate closingDate,
            LocalDate dueDate
    ) {
        return new FinancialCreditCardInvoice(
                creditCard,
                referenceMonth,
                closingDate,
                dueDate
        );
    }

    public void close() {
        if (!isOpen()) {
            throw new IllegalStateException(
                    "Only an open invoice can be closed"
            );
        }

        status = FinancialCreditCardInvoiceStatus.CLOSED;
    }

    public void reopen() {
        if (!isClosed()) {
            throw new IllegalStateException(
                    "Only a closed invoice can be reopened"
            );
        }

        status = FinancialCreditCardInvoiceStatus.OPEN;
    }

    public void markAsPaid() {
        if (!isClosed()) {
            throw new IllegalStateException(
                    "Only a closed invoice can be paid"
            );
        }

        status = FinancialCreditCardInvoiceStatus.PAID;
        paidAt = Instant.now();
    }

    public void reversePayment() {
        if (!isPaid()) {
            throw new IllegalStateException(
                    "Only a paid invoice can have its payment reversed"
            );
        }

        status = FinancialCreditCardInvoiceStatus.CLOSED;
        paidAt = null;
    }

    public void cancel() {
        if (isPaid()) {
            throw new IllegalStateException(
                    "Paid invoice cannot be cancelled"
            );
        }

        status = FinancialCreditCardInvoiceStatus.CANCELLED;
        paidAt = null;
    }

    public boolean isOpen() {
        return status == FinancialCreditCardInvoiceStatus.OPEN;
    }

    public boolean isClosed() {
        return status == FinancialCreditCardInvoiceStatus.CLOSED;
    }

    public boolean isPaid() {
        return status == FinancialCreditCardInvoiceStatus.PAID;
    }

    public boolean isCancelled() {
        return status
                == FinancialCreditCardInvoiceStatus.CANCELLED;
    }

    @PrePersist
    private void onCreate() {
        Instant now = Instant.now();

        createdAt = now;
        updatedAt = now;

        if (status == null) {
            status = FinancialCreditCardInvoiceStatus.OPEN;
        }
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = Instant.now();
    }

    private static LocalDate normalizeMonth(LocalDate value) {
        return Objects.requireNonNull(
                value,
                "Reference month cannot be null"
        ).withDayOfMonth(1);
    }

    private static void validateDates(
            LocalDate closingDate,
            LocalDate dueDate
    ) {
        if (dueDate.isBefore(closingDate)) {
            throw new IllegalArgumentException(
                    "Due date cannot be before closing date"
            );
        }
    }

    public UUID getId() {
        return id;
    }

    public FinancialCreditCard getCreditCard() {
        return creditCard;
    }

    public LocalDate getReferenceMonth() {
        return referenceMonth;
    }

    public LocalDate getClosingDate() {
        return closingDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public FinancialCreditCardInvoiceStatus getStatus() {
        return status;
    }

    public Instant getPaidAt() {
        return paidAt;
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