CREATE TABLE financial_transfers (
    id UUID PRIMARY KEY,
    family_id UUID NOT NULL,
    source_account_id UUID NOT NULL,
    destination_account_id UUID NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    transfer_date DATE NOT NULL,
    type VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    notes VARCHAR(1000),
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_financial_transfers_family
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_financial_transfers_source_account
        FOREIGN KEY (source_account_id)
        REFERENCES financial_accounts(id),
    CONSTRAINT fk_financial_transfers_destination_account
        FOREIGN KEY (destination_account_id)
        REFERENCES financial_accounts(id),
    CONSTRAINT fk_financial_transfers_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),
    CONSTRAINT ck_financial_transfers_amount
        CHECK (amount > 0),
    CONSTRAINT ck_financial_transfers_accounts
        CHECK (source_account_id <> destination_account_id),
    CONSTRAINT ck_financial_transfers_type
        CHECK (type IN ('INVESTMENT_CONTRIBUTION', 'INVESTMENT_REDEMPTION')),
    CONSTRAINT ck_financial_transfers_status
        CHECK (status IN ('COMPLETED', 'REVERSED'))
);

CREATE INDEX idx_financial_transfers_family_date
    ON financial_transfers(family_id, transfer_date DESC);

CREATE INDEX idx_financial_transfers_source_account
    ON financial_transfers(source_account_id);

CREATE INDEX idx_financial_transfers_destination_account
    ON financial_transfers(destination_account_id);
