package br.com.nucleo.api.finance.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity @Table(name = "financial_market_index_values")
public class FinancialMarketIndexValue {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "market_index_id", nullable = false)
    private FinancialMarketIndex marketIndex;
    @Column(name = "reference_date", nullable = false) private LocalDate referenceDate;
    @Column(nullable = false, precision = 20, scale = 10) private BigDecimal value;
    @Column(nullable = false, length = 40) private String unit;
    @Column(nullable = false, length = 30) private String periodicity;
    @Column(nullable = false, length = 120) private String source;
    @Column(name = "fetched_at", nullable = false) private Instant fetchedAt;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private FinancialMarketIndexStatus status;
    @Column(name = "audit_hash", length = 128) private String auditHash;
    @Column(name = "raw_content") private String rawContent;
    @Version @Column(nullable = false) private long version;
    protected FinancialMarketIndexValue() {}
    public static FinancialMarketIndexValue official(FinancialMarketIndex index, LocalDate date, BigDecimal value, String unit, String periodicity, String source, String raw) {
        FinancialMarketIndexValue item = new FinancialMarketIndexValue();
        item.marketIndex = index; item.referenceDate = date; item.value = value; item.unit = unit; item.periodicity = periodicity; item.source = source;
        item.fetchedAt = Instant.now(); item.status = FinancialMarketIndexStatus.OFFICIAL; item.rawContent = raw; item.auditHash = Integer.toHexString((date + ":" + value + ":" + raw).hashCode()); return item;
    }
    public UUID getId() { return id; } public LocalDate getReferenceDate() { return referenceDate; } public BigDecimal getValue() { return value; }
}
