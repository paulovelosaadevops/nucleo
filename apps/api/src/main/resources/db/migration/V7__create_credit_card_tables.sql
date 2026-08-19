CREATE TABLE financial_credit_cards (
    id UUID PRIMARY KEY,
    family_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    brand VARCHAR(30) NOT NULL,
    last_four VARCHAR(4),
    credit_limit NUMERIC(18, 2) NOT NULL,
    closing_day INTEGER NOT NULL,
    due_day INTEGER NOT NULL,
    payment_account_id UUID,
    color VARCHAR(20),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_credit_cards_family
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_credit_cards_payment_account
        FOREIGN KEY (payment_account_id)
        REFERENCES financial_accounts(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_credit_cards_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    CONSTRAINT ck_credit_cards_name
        CHECK (
            CHAR_LENGTH(TRIM(name))
            BETWEEN 2 AND 120
        ),

    CONSTRAINT ck_credit_cards_brand
        CHECK (
            brand IN (
                'VISA',
                'MASTERCARD',
                'ELO',
                'AMERICAN_EXPRESS',
                'HIPERCARD',
                'OTHER'
            )
        ),

    CONSTRAINT ck_credit_cards_last_four
        CHECK (
            last_four IS NULL
            OR last_four ~ '^[0-9]{4}$'
        ),

    CONSTRAINT ck_credit_cards_limit
        CHECK (credit_limit > 0),

    CONSTRAINT ck_credit_cards_closing_day
        CHECK (closing_day BETWEEN 1 AND 28),

    CONSTRAINT ck_credit_cards_due_day
        CHECK (due_day BETWEEN 1 AND 28)
);

CREATE TABLE financial_credit_card_invoices (
    id UUID PRIMARY KEY,
    credit_card_id UUID NOT NULL,
    reference_month DATE NOT NULL,
    closing_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_credit_card_invoices_card
        FOREIGN KEY (credit_card_id)
        REFERENCES financial_credit_cards(id)
        ON DELETE CASCADE,

    CONSTRAINT ck_credit_card_invoices_reference_month
        CHECK (
            EXTRACT(DAY FROM reference_month) = 1
        ),

    CONSTRAINT ck_credit_card_invoices_dates
        CHECK (due_date >= closing_date),

    CONSTRAINT ck_credit_card_invoices_status
        CHECK (
            status IN (
                'OPEN',
                'CLOSED',
                'PAID',
                'CANCELLED'
            )
        ),

    CONSTRAINT ck_credit_card_invoices_paid_state
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
        ),

    CONSTRAINT uk_credit_card_invoice_month
        UNIQUE (
            credit_card_id,
            reference_month
        )
);

CREATE TABLE financial_credit_card_purchases (
    id UUID PRIMARY KEY,
    family_id UUID NOT NULL,
    credit_card_id UUID NOT NULL,
    category_id UUID,
    description VARCHAR(160) NOT NULL,
    total_amount NUMERIC(18, 2) NOT NULL,
    purchase_date DATE NOT NULL,
    total_installments INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes VARCHAR(1000),
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_credit_card_purchases_family
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_credit_card_purchases_card
        FOREIGN KEY (credit_card_id)
        REFERENCES financial_credit_cards(id),

    CONSTRAINT fk_credit_card_purchases_category
        FOREIGN KEY (category_id)
        REFERENCES financial_categories(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_credit_card_purchases_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    CONSTRAINT ck_credit_card_purchases_description
        CHECK (
            CHAR_LENGTH(TRIM(description))
            BETWEEN 1 AND 160
        ),

    CONSTRAINT ck_credit_card_purchases_amount
        CHECK (total_amount > 0),

    CONSTRAINT ck_credit_card_purchases_installments
        CHECK (
            total_installments
            BETWEEN 1 AND 120
        ),

    CONSTRAINT ck_credit_card_purchases_status
        CHECK (
            status IN ('ACTIVE', 'CANCELLED')
        )
);

CREATE TABLE financial_credit_card_installments (
    id UUID PRIMARY KEY,
    purchase_id UUID NOT NULL,
    invoice_id UUID NOT NULL,
    installment_number INTEGER NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_credit_card_installments_purchase
        FOREIGN KEY (purchase_id)
        REFERENCES financial_credit_card_purchases(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_credit_card_installments_invoice
        FOREIGN KEY (invoice_id)
        REFERENCES financial_credit_card_invoices(id),

    CONSTRAINT ck_credit_card_installments_number
        CHECK (installment_number > 0),

    CONSTRAINT ck_credit_card_installments_amount
        CHECK (amount > 0),

    CONSTRAINT ck_credit_card_installments_status
        CHECK (
            status IN ('OPEN', 'CANCELLED')
        ),

    CONSTRAINT uk_credit_card_purchase_installment
        UNIQUE (
            purchase_id,
            installment_number
        )
);

ALTER TABLE financial_transactions
    ADD COLUMN credit_card_invoice_id UUID;

ALTER TABLE financial_transactions
    ADD COLUMN exclude_from_reports BOOLEAN
        NOT NULL DEFAULT FALSE;

ALTER TABLE financial_transactions
    ADD CONSTRAINT fk_financial_transactions_credit_card_invoice
        FOREIGN KEY (credit_card_invoice_id)
        REFERENCES financial_credit_card_invoices(id)
        ON DELETE SET NULL;

CREATE UNIQUE INDEX uk_financial_transaction_invoice_payment
    ON financial_transactions(credit_card_invoice_id)
    WHERE credit_card_invoice_id IS NOT NULL;

CREATE UNIQUE INDEX uk_credit_cards_family_name
    ON financial_credit_cards(
        family_id,
        LOWER(name)
    );

CREATE INDEX idx_credit_cards_family_active
    ON financial_credit_cards(
        family_id,
        active
    );

CREATE INDEX idx_credit_card_invoices_card_month
    ON financial_credit_card_invoices(
        credit_card_id,
        reference_month DESC
    );

CREATE INDEX idx_credit_card_invoices_due_status
    ON financial_credit_card_invoices(
        due_date,
        status
    );

CREATE INDEX idx_credit_card_purchases_family_date
    ON financial_credit_card_purchases(
        family_id,
        purchase_date DESC
    );

CREATE INDEX idx_credit_card_purchases_card
    ON financial_credit_card_purchases(
        credit_card_id
    );

CREATE INDEX idx_credit_card_purchases_category
    ON financial_credit_card_purchases(
        category_id
    );

CREATE INDEX idx_credit_card_installments_invoice
    ON financial_credit_card_installments(
        invoice_id,
        status
    );

CREATE INDEX idx_credit_card_installments_purchase
    ON financial_credit_card_installments(
        purchase_id,
        installment_number
    );

CREATE INDEX idx_financial_transactions_invoice
    ON financial_transactions(
        credit_card_invoice_id
    );