CREATE TABLE financial_recurrences (
    id UUID PRIMARY KEY,
    family_id UUID NOT NULL,
    account_id UUID NOT NULL,
    category_id UUID,
    type VARCHAR(20) NOT NULL,
    description VARCHAR(160) NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    recurrence_interval INTEGER NOT NULL DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE,
    next_generation_date DATE NOT NULL,
    remaining_occurrences INTEGER,
    payment_method VARCHAR(30),
    notes VARCHAR(1000),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_financial_recurrences_family
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_financial_recurrences_account
        FOREIGN KEY (account_id)
        REFERENCES financial_accounts(id),

    CONSTRAINT fk_financial_recurrences_category
        FOREIGN KEY (category_id)
        REFERENCES financial_categories(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_financial_recurrences_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    CONSTRAINT ck_financial_recurrences_type
        CHECK (
            type IN ('INCOME', 'EXPENSE')
        ),

    CONSTRAINT ck_financial_recurrences_description
        CHECK (
            CHAR_LENGTH(TRIM(description))
            BETWEEN 1 AND 160
        ),

    CONSTRAINT ck_financial_recurrences_amount
        CHECK (amount > 0),

    CONSTRAINT ck_financial_recurrences_frequency
        CHECK (
            frequency IN (
                'DAILY',
                'WEEKLY',
                'MONTHLY',
                'YEARLY'
            )
        ),

    CONSTRAINT ck_financial_recurrences_interval
        CHECK (
            recurrence_interval
            BETWEEN 1 AND 365
        ),

    CONSTRAINT ck_financial_recurrences_period
        CHECK (
            end_date IS NULL
            OR end_date >= start_date
        ),

    CONSTRAINT ck_financial_recurrences_remaining
        CHECK (
            remaining_occurrences IS NULL
            OR remaining_occurrences > 0
        ),

    CONSTRAINT ck_financial_recurrences_payment_method
        CHECK (
            payment_method IS NULL
            OR payment_method IN (
                'CASH',
                'PIX',
                'DEBIT_CARD',
                'BANK_TRANSFER',
                'BANK_SLIP',
                'DIRECT_DEBIT',
                'OTHER'
            )
        )
);

ALTER TABLE financial_transactions
    ADD COLUMN recurrence_id UUID;

ALTER TABLE financial_transactions
    ADD COLUMN recurrence_sequence INTEGER;

ALTER TABLE financial_transactions
    ADD CONSTRAINT fk_financial_transactions_recurrence
        FOREIGN KEY (recurrence_id)
        REFERENCES financial_recurrences(id)
        ON DELETE SET NULL;

ALTER TABLE financial_transactions
    ADD CONSTRAINT ck_financial_transactions_recurrence_sequence
        CHECK (
            recurrence_sequence IS NULL
            OR recurrence_sequence > 0
        );

CREATE UNIQUE INDEX uk_financial_transaction_recurrence_sequence
    ON financial_transactions(
        recurrence_id,
        recurrence_sequence
    )
    WHERE recurrence_id IS NOT NULL;

CREATE TABLE financial_budgets (
    id UUID PRIMARY KEY,
    family_id UUID NOT NULL,
    category_id UUID NOT NULL,
    reference_month DATE NOT NULL,
    limit_amount NUMERIC(18, 2) NOT NULL,
    alert_percentage NUMERIC(5, 2) NOT NULL DEFAULT 80,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_financial_budgets_family
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_financial_budgets_category
        FOREIGN KEY (category_id)
        REFERENCES financial_categories(id),

    CONSTRAINT ck_financial_budgets_reference_month
        CHECK (
            EXTRACT(DAY FROM reference_month) = 1
        ),

    CONSTRAINT ck_financial_budgets_limit
        CHECK (limit_amount > 0),

    CONSTRAINT ck_financial_budgets_alert_percentage
        CHECK (
            alert_percentage
            BETWEEN 1 AND 100
        ),

    CONSTRAINT uk_financial_budgets_category_month
        UNIQUE (
            family_id,
            category_id,
            reference_month
        )
);

CREATE INDEX idx_financial_recurrences_family_active
    ON financial_recurrences(
        family_id,
        active
    );

CREATE INDEX idx_financial_recurrences_generation
    ON financial_recurrences(
        next_generation_date
    )
    WHERE active = TRUE;

CREATE INDEX idx_financial_transactions_recurrence
    ON financial_transactions(recurrence_id);

CREATE INDEX idx_financial_budgets_family_month
    ON financial_budgets(
        family_id,
        reference_month
    );

CREATE INDEX idx_financial_budgets_category
    ON financial_budgets(category_id);