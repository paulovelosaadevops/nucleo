package br.com.nucleo.api.finance.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "financial_investment_movements")
public class FinancialInvestmentMovement {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "investment_id", nullable = false)
    private FinancialInvestment investment;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "transfer_id")
    private FinancialTransfer transfer;
    @Enumerated(EnumType.STRING) @Column(name = "movement_type", nullable = false, length = 40)
    private FinancialInvestmentMovementType movementType;
    @Column(name = "movement_date", nullable = false) private LocalDate movementDate;
    @Column(nullable = false, precision = 18, scale = 8) private BigDecimal amount;
    @Column(name = "calculated_balance_before", precision = 18, scale = 8) private BigDecimal calculatedBalanceBefore;
    @Column(name = "calculated_balance_after", precision = 18, scale = 8) private BigDecimal calculatedBalanceAfter;
    @Column(length = 1000) private String notes;
    @Column(name = "idempotency_key", length = 160) private String idempotencyKey;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Version @Column(nullable = false) private long version;
    protected FinancialInvestmentMovement() {}
    public static FinancialInvestmentMovement create(FinancialInvestment investment, FinancialTransfer transfer,
            FinancialInvestmentMovementType type, LocalDate date, BigDecimal amount, BigDecimal before,
            BigDecimal after, String notes, String idempotencyKey) {
        FinancialInvestmentMovement movement = new FinancialInvestmentMovement();
        movement.investment = investment; movement.transfer = transfer; movement.movementType = type;
        movement.movementDate = date; movement.amount = amount; movement.calculatedBalanceBefore = before;
        movement.calculatedBalanceAfter = after; movement.notes = notes; movement.idempotencyKey = idempotencyKey;
        return movement;
    }
    public void consolidate(BigDecimal additionalAmount, BigDecimal after, String additionalNotes) {
        amount = amount.add(additionalAmount);
        calculatedBalanceAfter = after;
        notes = mergeNotes(notes, additionalNotes);
    }
    @PrePersist private void onCreate() { createdAt = Instant.now(); }
    public UUID getId() { return id; } public FinancialInvestmentMovementType getMovementType() { return movementType; }
    public LocalDate getMovementDate() { return movementDate; } public BigDecimal getAmount() { return amount; }
    public BigDecimal getCalculatedBalanceAfter() { return calculatedBalanceAfter; } public String getNotes() { return notes; }
    public BigDecimal getCalculatedBalanceBefore() { return calculatedBalanceBefore; }
    public Instant getCreatedAt() { return createdAt; }

    private static String mergeNotes(String current, String additional) {
        if (additional == null || additional.isBlank()) return current;
        if (current == null || current.isBlank()) return additional.trim();
        String merged = current + " | " + additional.trim();
        return merged.length() > 1000 ? merged.substring(0, 1000) : merged;
    }
}
