package br.com.nucleo.api.finance.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity @Table(name = "financial_investment_yield_entries")
public class FinancialInvestmentYieldEntry {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "investment_id", nullable = false) private FinancialInvestment investment;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "lot_id", nullable = false) private FinancialInvestmentLot lot;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "market_index_value_id") private FinancialMarketIndexValue marketIndexValue;
    @Column(name = "reference_date", nullable = false) private LocalDate referenceDate;
    @Column(name = "benchmark_factor", precision = 24, scale = 14) private BigDecimal benchmarkFactor;
    @Column(name = "fixed_factor", precision = 24, scale = 14) private BigDecimal fixedFactor;
    @Column(name = "applied_factor", nullable = false, precision = 24, scale = 14) private BigDecimal appliedFactor;
    @Column(name = "gross_yield", nullable = false, precision = 18, scale = 8) private BigDecimal grossYield;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private FinancialInvestmentYieldStatus status;
    @Column(name = "idempotency_key", nullable = false, length = 180) private String idempotencyKey;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Version @Column(nullable = false) private long version;
    protected FinancialInvestmentYieldEntry() {}
    public static FinancialInvestmentYieldEntry create(FinancialInvestment investment, FinancialInvestmentLot lot, FinancialMarketIndexValue value,
            LocalDate date, BigDecimal benchmarkFactor, BigDecimal fixedFactor, BigDecimal appliedFactor, BigDecimal grossYield, FinancialInvestmentYieldStatus status, String key) {
        FinancialInvestmentYieldEntry entry = new FinancialInvestmentYieldEntry();
        entry.investment = investment; entry.lot = lot; entry.marketIndexValue = value; entry.referenceDate = date;
        entry.benchmarkFactor = benchmarkFactor; entry.fixedFactor = fixedFactor; entry.appliedFactor = appliedFactor; entry.grossYield = grossYield; entry.status = status; entry.idempotencyKey = key; return entry;
    }
    @PrePersist private void onCreate() { createdAt = Instant.now(); }
}
