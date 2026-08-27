package br.com.nucleo.api.finance.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "financial_investment_lots")
public class FinancialInvestmentLot {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "investment_id", nullable = false)
    private FinancialInvestment investment;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transfer_id")
    private FinancialTransfer transfer;
    @Column(name = "contribution_date", nullable = false)
    private LocalDate contributionDate;
    @Column(name = "accrual_start_date", nullable = false)
    private LocalDate accrualStartDate;
    @Column(name = "initial_amount", nullable = false, precision = 18, scale = 8)
    private BigDecimal initialAmount;
    @Column(name = "remaining_amount", nullable = false, precision = 18, scale = 8)
    private BigDecimal remainingAmount;
    @Column(name = "accumulated_yield", nullable = false, precision = 18, scale = 8)
    private BigDecimal accumulatedYield;
    @Column(nullable = false)
    private boolean active;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    @Version @Column(nullable = false)
    private long version;
    protected FinancialInvestmentLot() {}
    public static FinancialInvestmentLot create(FinancialInvestment investment, FinancialTransfer transfer,
            LocalDate contributionDate, LocalDate accrualStartDate, BigDecimal amount) {
        FinancialInvestmentLot lot = new FinancialInvestmentLot();
        lot.investment = investment; lot.transfer = transfer; lot.contributionDate = contributionDate;
        lot.accrualStartDate = accrualStartDate; lot.initialAmount = amount; lot.remainingAmount = amount;
        lot.accumulatedYield = BigDecimal.ZERO; lot.active = true; return lot;
    }
    public void reduce(BigDecimal amount) { remainingAmount = remainingAmount.subtract(amount); if (remainingAmount.signum() == 0) active = false; }
    public void addYield(BigDecimal amount) { remainingAmount = remainingAmount.add(amount); accumulatedYield = accumulatedYield.add(amount); }
    @PrePersist private void onCreate() { Instant now = Instant.now(); createdAt = now; updatedAt = now; }
    @PreUpdate private void onUpdate() { updatedAt = Instant.now(); }
    public UUID getId() { return id; } public FinancialInvestment getInvestment() { return investment; }
    public LocalDate getContributionDate() { return contributionDate; } public LocalDate getAccrualStartDate() { return accrualStartDate; }
    public BigDecimal getRemainingAmount() { return remainingAmount; } public boolean isActive() { return active; }
}
