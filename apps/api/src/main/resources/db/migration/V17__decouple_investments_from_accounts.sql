ALTER TABLE financial_investments
    DROP CONSTRAINT IF EXISTS uk_financial_investments_account;

ALTER TABLE financial_investments
    DROP CONSTRAINT IF EXISTS fk_financial_investments_account;

ALTER TABLE financial_investments
    DROP COLUMN IF EXISTS account_id;

ALTER TABLE financial_transfers
    ALTER COLUMN source_account_id DROP NOT NULL,
    ALTER COLUMN destination_account_id DROP NOT NULL;
