CREATE TABLE financial_recurrence_occurrences (
    id UUID PRIMARY KEY,
    recurrence_id UUID NOT NULL,
    family_id UUID NOT NULL,
    reference_month DATE NOT NULL,
    scheduled_date DATE NOT NULL,
    reminder_date DATE,
    status VARCHAR(30) NOT NULL,
    estimated_amount NUMERIC(18, 2) NOT NULL,
    confirmed_amount NUMERIC(18, 2),
    confirmed_date DATE,
    category_id UUID,
    account_id UUID,
    credit_card_id UUID,
    transaction_id UUID,
    purchase_id UUID,
    notes VARCHAR(1000),
    confirmed_by_user_id UUID,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_recurrence_occurrences_recurrence
        FOREIGN KEY (recurrence_id)
        REFERENCES financial_recurrences(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_recurrence_occurrences_family
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_recurrence_occurrences_category
        FOREIGN KEY (category_id)
        REFERENCES financial_categories(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_recurrence_occurrences_account
        FOREIGN KEY (account_id)
        REFERENCES financial_accounts(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_recurrence_occurrences_credit_card
        FOREIGN KEY (credit_card_id)
        REFERENCES financial_credit_cards(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_recurrence_occurrences_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES financial_transactions(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_recurrence_occurrences_purchase
        FOREIGN KEY (purchase_id)
        REFERENCES financial_credit_card_purchases(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_recurrence_occurrences_confirmed_by
        FOREIGN KEY (confirmed_by_user_id)
        REFERENCES users(id),

    CONSTRAINT ck_recurrence_occurrences_reference_month
        CHECK (EXTRACT(DAY FROM reference_month) = 1),

    CONSTRAINT ck_recurrence_occurrences_status
        CHECK (
            status IN (
                'AWAITING_CONFIRMATION',
                'CONFIRMED',
                'SKIPPED',
                'OVERDUE',
                'CANCELLED'
            )
        ),

    CONSTRAINT ck_recurrence_occurrences_amounts
        CHECK (
            estimated_amount > 0
            AND (
                confirmed_amount IS NULL
                OR confirmed_amount > 0
            )
        ),

    CONSTRAINT ck_recurrence_occurrences_confirmation_state
        CHECK (
            (
                status = 'CONFIRMED'
                AND confirmed_amount IS NOT NULL
                AND confirmed_date IS NOT NULL
                AND confirmed_by_user_id IS NOT NULL
                AND confirmed_at IS NOT NULL
                AND (
                    transaction_id IS NOT NULL
                    OR purchase_id IS NOT NULL
                )
            )
            OR
            (
                status <> 'CONFIRMED'
                AND transaction_id IS NULL
                AND purchase_id IS NULL
            )
        )
);

CREATE UNIQUE INDEX uk_financial_recurrence_occurrence_month
    ON financial_recurrence_occurrences(
        recurrence_id,
        reference_month
    );

CREATE INDEX idx_recurrence_occurrences_family_status
    ON financial_recurrence_occurrences(
        family_id,
        status,
        scheduled_date
    );

CREATE INDEX idx_recurrence_occurrences_credit_card
    ON financial_recurrence_occurrences(
        credit_card_id,
        reference_month
    )
    WHERE credit_card_id IS NOT NULL;

ALTER TABLE financial_recurrences
    ADD COLUMN requires_confirmation BOOLEAN NOT NULL DEFAULT TRUE;
