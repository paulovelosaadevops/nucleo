CREATE TABLE financial_accounts (
    id UUID PRIMARY KEY,
    family_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    type VARCHAR(30) NOT NULL,
    initial_balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
    color VARCHAR(20),
    include_in_total BOOLEAN NOT NULL DEFAULT TRUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_financial_accounts_family
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_financial_accounts_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    CONSTRAINT ck_financial_accounts_name
        CHECK (
            CHAR_LENGTH(TRIM(name))
            BETWEEN 2 AND 120
        ),

    CONSTRAINT ck_financial_accounts_type
        CHECK (
            type IN (
                'CASH',
                'CHECKING',
                'SAVINGS',
                'INVESTMENT',
                'DIGITAL_WALLET',
                'OTHER'
            )
        )
);

CREATE TABLE financial_categories (
    id UUID PRIMARY KEY,
    family_id UUID NOT NULL,
    name VARCHAR(80) NOT NULL,
    type VARCHAR(20) NOT NULL,
    color VARCHAR(20),
    icon VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_financial_categories_family
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,

    CONSTRAINT ck_financial_categories_name
        CHECK (
            CHAR_LENGTH(TRIM(name))
            BETWEEN 2 AND 80
        ),

    CONSTRAINT ck_financial_categories_type
        CHECK (
            type IN ('INCOME', 'EXPENSE')
        )
);

CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY,
    family_id UUID NOT NULL,
    account_id UUID NOT NULL,
    category_id UUID,
    type VARCHAR(20) NOT NULL,
    description VARCHAR(160) NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(30),
    paid_at TIMESTAMPTZ,
    notes VARCHAR(1000),
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_financial_transactions_family
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_financial_transactions_account
        FOREIGN KEY (account_id)
        REFERENCES financial_accounts(id),

    CONSTRAINT fk_financial_transactions_category
        FOREIGN KEY (category_id)
        REFERENCES financial_categories(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_financial_transactions_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    CONSTRAINT ck_financial_transactions_type
        CHECK (
            type IN ('INCOME', 'EXPENSE')
        ),

    CONSTRAINT ck_financial_transactions_description
        CHECK (
            CHAR_LENGTH(TRIM(description))
            BETWEEN 1 AND 160
        ),

    CONSTRAINT ck_financial_transactions_amount
        CHECK (amount > 0),

    CONSTRAINT ck_financial_transactions_status
        CHECK (
            status IN (
                'PENDING',
                'PAID',
                'CANCELLED'
            )
        ),

    CONSTRAINT ck_financial_transactions_payment_method
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
        ),

    CONSTRAINT ck_financial_transactions_paid_state
        CHECK (
            (
                status = 'PAID'
                AND paid_at IS NOT NULL
            )
            OR
            (
                status <> 'PAID'
                AND paid_at IS NULL
            )
        )
);

CREATE INDEX idx_financial_accounts_family
    ON financial_accounts(family_id);

CREATE INDEX idx_financial_accounts_family_active
    ON financial_accounts(family_id, active);

CREATE UNIQUE INDEX uk_financial_accounts_family_name
    ON financial_accounts(
        family_id,
        LOWER(name)
    );

CREATE INDEX idx_financial_categories_family_type
    ON financial_categories(family_id, type);

CREATE INDEX idx_financial_categories_family_active
    ON financial_categories(family_id, active);

CREATE UNIQUE INDEX uk_financial_categories_family_type_name
    ON financial_categories(
        family_id,
        type,
        LOWER(name)
    );

CREATE INDEX idx_financial_transactions_family_date
    ON financial_transactions(
        family_id,
        transaction_date DESC
    );

CREATE INDEX idx_financial_transactions_account_date
    ON financial_transactions(
        account_id,
        transaction_date DESC
    );

CREATE INDEX idx_financial_transactions_category
    ON financial_transactions(category_id);

CREATE INDEX idx_financial_transactions_family_status
    ON financial_transactions(family_id, status);

CREATE INDEX idx_financial_transactions_due_date
    ON financial_transactions(
        family_id,
        due_date
    )
    WHERE status = 'PENDING';