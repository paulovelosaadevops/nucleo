ALTER TABLE financial_credit_card_purchases
    ADD COLUMN purchase_type VARCHAR(20) NOT NULL DEFAULT 'DEBIT';

ALTER TABLE financial_credit_card_purchases
    ADD CONSTRAINT ck_credit_card_purchases_type
        CHECK (purchase_type IN ('DEBIT', 'CREDIT'));
