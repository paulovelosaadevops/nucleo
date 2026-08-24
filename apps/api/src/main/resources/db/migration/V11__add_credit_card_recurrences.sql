ALTER TABLE financial_recurrences
    ALTER COLUMN account_id DROP NOT NULL;

ALTER TABLE financial_recurrences
    ADD COLUMN credit_card_id UUID;

ALTER TABLE financial_recurrences
    ADD CONSTRAINT fk_financial_recurrences_credit_card
        FOREIGN KEY (credit_card_id)
        REFERENCES financial_credit_cards(id);

ALTER TABLE financial_recurrences
    DROP CONSTRAINT ck_financial_recurrences_payment_method;

ALTER TABLE financial_recurrences
    ADD CONSTRAINT ck_financial_recurrences_payment_method
        CHECK (
            payment_method IS NULL
            OR payment_method IN (
                'CASH',
                'PIX',
                'DEBIT_CARD',
                'CREDIT_CARD',
                'BANK_TRANSFER',
                'BANK_SLIP',
                'DIRECT_DEBIT',
                'OTHER'
            )
        );

ALTER TABLE financial_recurrences
    ADD CONSTRAINT ck_financial_recurrences_source
        CHECK (
            (
                account_id IS NOT NULL
                AND credit_card_id IS NULL
                AND (
                    payment_method IS NULL
                    OR payment_method <> 'CREDIT_CARD'
                )
            )
            OR
            (
                account_id IS NULL
                AND credit_card_id IS NOT NULL
                AND type = 'EXPENSE'
                AND payment_method = 'CREDIT_CARD'
            )
        );

ALTER TABLE financial_credit_card_purchases
    ADD COLUMN recurrence_id UUID;

ALTER TABLE financial_credit_card_purchases
    ADD COLUMN recurrence_sequence INTEGER;

ALTER TABLE financial_credit_card_purchases
    ADD CONSTRAINT fk_credit_card_purchases_recurrence
        FOREIGN KEY (recurrence_id)
        REFERENCES financial_recurrences(id)
        ON DELETE SET NULL;

ALTER TABLE financial_credit_card_purchases
    ADD CONSTRAINT ck_credit_card_purchases_recurrence_sequence
        CHECK (
            (
                recurrence_id IS NULL
                AND recurrence_sequence IS NULL
            )
            OR
            (
                recurrence_id IS NOT NULL
                AND recurrence_sequence IS NOT NULL
                AND recurrence_sequence > 0
            )
        );

CREATE UNIQUE INDEX uk_credit_card_purchase_recurrence_sequence
    ON financial_credit_card_purchases(
        recurrence_id,
        recurrence_sequence
    )
    WHERE recurrence_id IS NOT NULL;

CREATE INDEX idx_financial_recurrences_credit_card
    ON financial_recurrences(credit_card_id);

CREATE INDEX idx_credit_card_purchases_recurrence
    ON financial_credit_card_purchases(recurrence_id);