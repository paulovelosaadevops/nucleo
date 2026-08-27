CREATE TABLE financial_market_indices (
    id UUID PRIMARY KEY,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(120) NOT NULL,
    unit VARCHAR(40) NOT NULL,
    periodicity VARCHAR(30) NOT NULL,
    source VARCHAR(120) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uk_market_indices_code_source
        UNIQUE (code, source)
);

CREATE TABLE financial_market_index_values (
    id UUID PRIMARY KEY,
    market_index_id UUID NOT NULL,
    reference_date DATE NOT NULL,
    value NUMERIC(20, 10) NOT NULL,
    unit VARCHAR(40) NOT NULL,
    periodicity VARCHAR(30) NOT NULL,
    source VARCHAR(120) NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL,
    audit_hash VARCHAR(128),
    raw_content TEXT,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_market_index_values_index
        FOREIGN KEY (market_index_id)
        REFERENCES financial_market_indices(id)
        ON DELETE CASCADE,
    CONSTRAINT ck_market_index_values_status
        CHECK (status IN ('OFFICIAL', 'PENDING', 'FAILED')),
    CONSTRAINT uk_market_index_values_reference
        UNIQUE (market_index_id, reference_date, source)
);

CREATE INDEX idx_market_index_values_lookup
    ON financial_market_index_values(market_index_id, reference_date DESC);
