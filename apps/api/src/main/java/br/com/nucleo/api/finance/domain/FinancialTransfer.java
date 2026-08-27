package br.com.nucleo.api.finance.domain;

import br.com.nucleo.api.family.domain.Family;
import br.com.nucleo.api.identity.user.domain.User;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "financial_transfers")
public class FinancialTransfer {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_account_id", nullable = false)
    private FinancialAccount sourceAccount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "destination_account_id", nullable = false)
    private FinancialAccount destinationAccount;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "transfer_date", nullable = false)
    private LocalDate transferDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private FinancialTransferType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FinancialTransferStatus status;

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

    protected FinancialTransfer() {
    }

    public static FinancialTransfer create(
            Family family,
            FinancialAccount sourceAccount,
            FinancialAccount destinationAccount,
            BigDecimal amount,
            LocalDate transferDate,
            FinancialTransferType type,
            String notes,
            User createdBy
    ) {
        FinancialTransfer transfer = new FinancialTransfer();
        transfer.family = Objects.requireNonNull(family);
        transfer.sourceAccount = Objects.requireNonNull(sourceAccount);
        transfer.destinationAccount = Objects.requireNonNull(destinationAccount);
        transfer.amount = validatePositiveMoney(amount);
        transfer.transferDate = Objects.requireNonNull(transferDate);
        transfer.type = Objects.requireNonNull(type);
        transfer.status = FinancialTransferStatus.COMPLETED;
        transfer.notes = normalize(notes);
        transfer.createdBy = Objects.requireNonNull(createdBy);
        return transfer;
    }

    @PrePersist
    private void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) status = FinancialTransferStatus.COMPLETED;
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = Instant.now();
    }

    private static BigDecimal validatePositiveMoney(BigDecimal value) {
        BigDecimal money = Objects.requireNonNull(value);
        if (money.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("O valor deve ser maior que zero");
        }
        return money;
    }

    private static String normalize(String value) {
        return value == null || value.isBlank()
                ? null
                : value.trim().replaceAll("\\s+", " ");
    }

    public UUID getId() { return id; }
    public Family getFamily() { return family; }
    public FinancialAccount getSourceAccount() { return sourceAccount; }
    public FinancialAccount getDestinationAccount() { return destinationAccount; }
    public BigDecimal getAmount() { return amount; }
    public LocalDate getTransferDate() { return transferDate; }
    public FinancialTransferType getType() { return type; }
    public FinancialTransferStatus getStatus() { return status; }
    public String getNotes() { return notes; }
    public User getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
