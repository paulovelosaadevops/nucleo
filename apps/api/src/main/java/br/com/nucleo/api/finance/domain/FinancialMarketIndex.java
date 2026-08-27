package br.com.nucleo.api.finance.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "financial_market_indices")
public class FinancialMarketIndex {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(nullable = false, length = 30) private String code;
    @Column(nullable = false, length = 120) private String name;
    @Column(nullable = false, length = 40) private String unit;
    @Column(nullable = false, length = 30) private String periodicity;
    @Column(nullable = false, length = 120) private String source;
    @Column(nullable = false) private boolean active;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @Version @Column(nullable = false) private long version;
    protected FinancialMarketIndex() {}
    public static FinancialMarketIndex create(String code, String name, String unit, String periodicity, String source) {
        FinancialMarketIndex index = new FinancialMarketIndex();
        index.code = code; index.name = name; index.unit = unit; index.periodicity = periodicity; index.source = source; index.active = true; return index;
    }
    @PrePersist private void onCreate() { Instant now = Instant.now(); createdAt = now; updatedAt = now; }
    @PreUpdate private void onUpdate() { updatedAt = Instant.now(); }
    public UUID getId() { return id; } public String getCode() { return code; }
}
