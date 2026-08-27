CREATE TABLE financial_investments (
    id UUID PRIMARY KEY,
    family_id UUID NOT NULL,
    account_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    institution VARCHAR(120) NOT NULL,
    modality VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    maturity_date DATE,
    liquidity VARCHAR(80),
    benchmark_percentage NUMERIC(9, 4),
    annual_fixed_rate NUMERIC(9, 4),
    annual_spread_rate NUMERIC(9, 4),
    tax_exempt BOOLEAN NOT NULL DEFAULT FALSE,
    auto_calculate BOOLEAN NOT NULL DEFAULT FALSE,
    accrual_start_rule VARCHAR(30) NOT NULL DEFAULT 'NEXT_BUSINESS_DAY',
    calculated_balance NUMERIC(18, 8) NOT NULL DEFAULT 0,
    real_balance NUMERIC(18, 2),
    total_contributed NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_redeemed NUMERIC(18, 2) NOT NULL DEFAULT 0,
    accumulated_yield NUMERIC(18, 8) NOT NULL DEFAULT 0,
    last_calculated_at DATE,
    last_reconciled_at DATE,
    notes VARCHAR(1000),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_financial_investments_family
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_financial_investments_account
        FOREIGN KEY (account_id)
        REFERENCES financial_accounts(id),
    CONSTRAINT fk_financial_investments_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),
    CONSTRAINT uk_financial_investments_account
        UNIQUE (account_id),
    CONSTRAINT ck_financial_investments_modality
        CHECK (modality IN ('PERCENT_CDI', 'CDI_PLUS', 'PERCENT_SELIC', 'FIXED_RATE', 'IPCA_PLUS', 'SAVINGS', 'MANUAL', 'NO_YIELD')),
    CONSTRAINT ck_financial_investments_accrual_start_rule
        CHECK (accrual_start_rule IN ('SAME_BUSINESS_DAY', 'NEXT_BUSINESS_DAY', 'SETTLEMENT_DATE')),
    CONSTRAINT ck_financial_investments_balances
        CHECK (calculated_balance >= 0 AND total_contributed >= 0 AND total_redeemed >= 0)
);

CREATE TABLE financial_investment_lots (
    id UUID PRIMARY KEY,
    investment_id UUID NOT NULL,
    transfer_id UUID,
    contribution_date DATE NOT NULL,
    accrual_start_date DATE NOT NULL,
    initial_amount NUMERIC(18, 8) NOT NULL,
    remaining_amount NUMERIC(18, 8) NOT NULL,
    accumulated_yield NUMERIC(18, 8) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_investment_lots_investment
        FOREIGN KEY (investment_id)
        REFERENCES financial_investments(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_investment_lots_transfer
        FOREIGN KEY (transfer_id)
        REFERENCES financial_transfers(id),
    CONSTRAINT ck_investment_lots_amounts
        CHECK (initial_amount > 0 AND remaining_amount >= 0)
);

CREATE TABLE financial_investment_movements (
    id UUID PRIMARY KEY,
    investment_id UUID NOT NULL,
    transfer_id UUID,
    movement_type VARCHAR(40) NOT NULL,
    movement_date DATE NOT NULL,
    amount NUMERIC(18, 8) NOT NULL,
    calculated_balance_before NUMERIC(18, 8),
    calculated_balance_after NUMERIC(18, 8),
    notes VARCHAR(1000),
    idempotency_key VARCHAR(160),
    created_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_investment_movements_investment
        FOREIGN KEY (investment_id)
        REFERENCES financial_investments(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_investment_movements_transfer
        FOREIGN KEY (transfer_id)
        REFERENCES financial_transfers(id),
    CONSTRAINT ck_investment_movements_type
        CHECK (movement_type IN ('INITIAL_BALANCE', 'CONTRIBUTION', 'REDEMPTION', 'YIELD', 'VALUATION_ADJUSTMENT', 'RECONCILIATION', 'CONFIGURATION_CHANGE')),
    CONSTRAINT uk_investment_movements_idempotency
        UNIQUE (idempotency_key)
);

CREATE TABLE financial_investment_snapshots (
    id UUID PRIMARY KEY,
    investment_id UUID NOT NULL,
    reference_date DATE NOT NULL,
    calculated_balance NUMERIC(18, 8) NOT NULL,
    real_balance NUMERIC(18, 2),
    total_contributed NUMERIC(18, 2) NOT NULL,
    total_redeemed NUMERIC(18, 2) NOT NULL,
    accumulated_yield NUMERIC(18, 8) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_investment_snapshots_investment
        FOREIGN KEY (investment_id)
        REFERENCES financial_investments(id)
        ON DELETE CASCADE,
    CONSTRAINT ck_investment_snapshots_status
        CHECK (status IN ('ESTIMATED', 'RECONCILED')),
    CONSTRAINT uk_investment_snapshots_date
        UNIQUE (investment_id, reference_date)
);

CREATE INDEX idx_financial_investments_family
    ON financial_investments(family_id, active, name);

CREATE INDEX idx_investment_lots_investment_fifo
    ON financial_investment_lots(investment_id, contribution_date, created_at);

CREATE INDEX idx_investment_movements_investment_date
    ON financial_investment_movements(investment_id, movement_date DESC);
