CREATE TABLE financial_investment_yield_entries (
    id UUID PRIMARY KEY,
    investment_id UUID NOT NULL,
    lot_id UUID NOT NULL,
    market_index_value_id UUID,
    reference_date DATE NOT NULL,
    benchmark_factor NUMERIC(24, 14),
    fixed_factor NUMERIC(24, 14),
    applied_factor NUMERIC(24, 14) NOT NULL,
    gross_yield NUMERIC(18, 8) NOT NULL,
    status VARCHAR(20) NOT NULL,
    idempotency_key VARCHAR(180) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_yield_entries_investment
        FOREIGN KEY (investment_id)
        REFERENCES financial_investments(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_yield_entries_lot
        FOREIGN KEY (lot_id)
        REFERENCES financial_investment_lots(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_yield_entries_market_value
        FOREIGN KEY (market_index_value_id)
        REFERENCES financial_market_index_values(id),
    CONSTRAINT ck_yield_entries_status
        CHECK (status IN ('ESTIMATED', 'OFFICIAL', 'MISSING_INDEX')),
    CONSTRAINT uk_yield_entries_idempotency
        UNIQUE (idempotency_key),
    CONSTRAINT uk_yield_entries_lot_date
        UNIQUE (lot_id, reference_date)
);

CREATE INDEX idx_yield_entries_investment_date
    ON financial_investment_yield_entries(investment_id, reference_date DESC);
