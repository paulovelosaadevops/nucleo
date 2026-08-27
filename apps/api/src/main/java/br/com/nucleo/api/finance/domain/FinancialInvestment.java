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
@Table(name = "financial_investments")
public class FinancialInvestment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private FinancialAccount account;
    @Column(nullable = false, length = 120)
    private String name;
    @Column(nullable = false, length = 120)
    private String institution;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FinancialInvestmentModality modality;
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    @Column(name = "maturity_date")
    private LocalDate maturityDate;
    @Column(length = 80)
    private String liquidity;
    @Column(name = "benchmark_percentage", precision = 9, scale = 4)
    private BigDecimal benchmarkPercentage;
    @Column(name = "annual_fixed_rate", precision = 9, scale = 4)
    private BigDecimal annualFixedRate;
    @Column(name = "annual_spread_rate", precision = 9, scale = 4)
    private BigDecimal annualSpreadRate;
    @Column(name = "tax_exempt", nullable = false)
    private boolean taxExempt;
    @Column(name = "auto_calculate", nullable = false)
    private boolean autoCalculate;
    @Enumerated(EnumType.STRING)
    @Column(name = "accrual_start_rule", nullable = false, length = 30)
    private FinancialInvestmentAccrualStartRule accrualStartRule;
    @Column(name = "calculated_balance", nullable = false, precision = 18, scale = 8)
    private BigDecimal calculatedBalance;
    @Column(name = "real_balance", precision = 18, scale = 2)
    private BigDecimal realBalance;
    @Column(name = "total_contributed", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalContributed;
    @Column(name = "total_redeemed", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalRedeemed;
    @Column(name = "accumulated_yield", nullable = false, precision = 18, scale = 8)
    private BigDecimal accumulatedYield;
    @Column(name = "last_calculated_at")
    private LocalDate lastCalculatedAt;
    @Column(name = "last_reconciled_at")
    private LocalDate lastReconciledAt;
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

    protected FinancialInvestment() {
    }

    public static FinancialInvestment create(Family family, FinancialAccount account, String name, String institution,
            FinancialInvestmentModality modality, LocalDate startDate, LocalDate maturityDate, String liquidity,
            BigDecimal benchmarkPercentage, BigDecimal annualFixedRate, BigDecimal annualSpreadRate,
            boolean taxExempt, boolean autoCalculate, FinancialInvestmentAccrualStartRule accrualStartRule,
            BigDecimal initialAmount, String notes, User createdBy) {
        FinancialInvestment investment = new FinancialInvestment();
        investment.family = Objects.requireNonNull(family);
        investment.account = Objects.requireNonNull(account);
        investment.name = normalize(name, 120);
        investment.institution = normalize(institution, 120);
        investment.modality = Objects.requireNonNull(modality);
        investment.startDate = Objects.requireNonNull(startDate);
        investment.maturityDate = maturityDate;
        investment.liquidity = normalizeOptional(liquidity, 80);
        investment.benchmarkPercentage = benchmarkPercentage;
        investment.annualFixedRate = annualFixedRate;
        investment.annualSpreadRate = annualSpreadRate;
        investment.taxExempt = taxExempt;
        investment.autoCalculate = autoCalculate && modality != FinancialInvestmentModality.MANUAL
                && modality != FinancialInvestmentModality.NO_YIELD;
        investment.accrualStartRule = accrualStartRule == null
                ? FinancialInvestmentAccrualStartRule.NEXT_BUSINESS_DAY
                : accrualStartRule;
        investment.calculatedBalance = money(initialAmount);
        investment.realBalance = initialAmount;
        investment.totalContributed = money(initialAmount);
        investment.totalRedeemed = BigDecimal.ZERO;
        investment.accumulatedYield = BigDecimal.ZERO;
        investment.lastCalculatedAt = startDate;
        investment.lastReconciledAt = startDate;
        investment.notes = normalizeOptional(notes, 1000);
        investment.active = true;
        investment.createdBy = Objects.requireNonNull(createdBy);
        return investment;
    }

    public void contribute(BigDecimal amount, LocalDate date) {
        calculatedBalance = calculatedBalance.add(money(amount));
        totalContributed = totalContributed.add(money(amount));
        realBalance = null;
        lastCalculatedAt = date;
    }

    public void redeem(BigDecimal amount, LocalDate date) {
        BigDecimal value = money(amount);
        if (calculatedBalance.compareTo(value) < 0) {
            throw new IllegalArgumentException("Saldo insuficiente para resgate");
        }
        calculatedBalance = calculatedBalance.subtract(value);
        totalRedeemed = totalRedeemed.add(value);
        realBalance = null;
        lastCalculatedAt = date;
    }

    public void yield(BigDecimal amount, LocalDate date) {
        calculatedBalance = calculatedBalance.add(amount);
        accumulatedYield = accumulatedYield.add(amount);
        realBalance = null;
        lastCalculatedAt = date;
    }

    public BigDecimal reconcile(BigDecimal real, LocalDate date) {
        BigDecimal before = calculatedBalance;
        realBalance = money(real);
        calculatedBalance = realBalance;
        lastReconciledAt = date;
        lastCalculatedAt = date;
        return calculatedBalance.subtract(before);
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

    private static BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static String normalize(String value, int max) {
        String result = Objects.requireNonNull(value).trim().replaceAll("\\s+", " ");
        if (result.isEmpty() || result.length() > max) throw new IllegalArgumentException("Texto invalido");
        return result;
    }

    private static String normalizeOptional(String value, int max) {
        if (value == null || value.isBlank()) return null;
        return normalize(value, max);
    }

    public UUID getId() { return id; }
    public Family getFamily() { return family; }
    public FinancialAccount getAccount() { return account; }
    public String getName() { return name; }
    public String getInstitution() { return institution; }
    public FinancialInvestmentModality getModality() { return modality; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getMaturityDate() { return maturityDate; }
    public String getLiquidity() { return liquidity; }
    public BigDecimal getBenchmarkPercentage() { return benchmarkPercentage; }
    public BigDecimal getAnnualFixedRate() { return annualFixedRate; }
    public BigDecimal getAnnualSpreadRate() { return annualSpreadRate; }
    public boolean isTaxExempt() { return taxExempt; }
    public boolean isAutoCalculate() { return autoCalculate; }
    public FinancialInvestmentAccrualStartRule getAccrualStartRule() { return accrualStartRule; }
    public BigDecimal getCalculatedBalance() { return calculatedBalance; }
    public BigDecimal getRealBalance() { return realBalance; }
    public BigDecimal getTotalContributed() { return totalContributed; }
    public BigDecimal getTotalRedeemed() { return totalRedeemed; }
    public BigDecimal getAccumulatedYield() { return accumulatedYield; }
    public LocalDate getLastCalculatedAt() { return lastCalculatedAt; }
    public LocalDate getLastReconciledAt() { return lastReconciledAt; }
    public String getNotes() { return notes; }
    public boolean isActive() { return active; }
}
