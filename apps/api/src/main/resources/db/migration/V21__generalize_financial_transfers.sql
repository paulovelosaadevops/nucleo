ALTER TABLE financial_transactions
    ADD COLUMN transfer_id UUID;

ALTER TABLE financial_transactions
    DROP CONSTRAINT ck_financial_transactions_type;

ALTER TABLE financial_transactions
    ADD CONSTRAINT ck_financial_transactions_type
        CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER_IN', 'TRANSFER_OUT'));

ALTER TABLE financial_transactions
    ADD CONSTRAINT fk_financial_transactions_transfer
        FOREIGN KEY (transfer_id)
        REFERENCES financial_transfers(id)
        ON DELETE CASCADE;

INSERT INTO financial_transactions (
    id,
    family_id,
    account_id,
    category_id,
    recurrence_id,
    recurrence_sequence,
    credit_card_invoice_id,
    transfer_id,
    exclude_from_reports,
    type,
    description,
    amount,
    transaction_date,
    due_date,
    status,
    payment_method,
    paid_at,
    notes,
    created_by_user_id,
    created_at,
    updated_at,
    version
)
SELECT
    gen_random_uuid(),
    transfer.family_id,
    transfer.source_account_id,
    NULL,
    NULL,
    NULL,
    NULL,
    transfer.id,
    TRUE,
    'TRANSFER_OUT',
    'Transferencia enviada',
    transfer.amount,
    transfer.transfer_date,
    transfer.transfer_date,
    'PAID',
    'BANK_TRANSFER',
    transfer.created_at,
    transfer.notes,
    transfer.created_by_user_id,
    transfer.created_at,
    transfer.updated_at,
    0
FROM financial_transfers transfer
WHERE transfer.source_account_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM financial_transactions transaction
      WHERE transaction.transfer_id = transfer.id
        AND transaction.type = 'TRANSFER_OUT'
  );

INSERT INTO financial_transactions (
    id,
    family_id,
    account_id,
    category_id,
    recurrence_id,
    recurrence_sequence,
    credit_card_invoice_id,
    transfer_id,
    exclude_from_reports,
    type,
    description,
    amount,
    transaction_date,
    due_date,
    status,
    payment_method,
    paid_at,
    notes,
    created_by_user_id,
    created_at,
    updated_at,
    version
)
SELECT
    gen_random_uuid(),
    transfer.family_id,
    transfer.destination_account_id,
    NULL,
    NULL,
    NULL,
    NULL,
    transfer.id,
    TRUE,
    'TRANSFER_IN',
    'Transferencia recebida',
    transfer.amount,
    transfer.transfer_date,
    transfer.transfer_date,
    'PAID',
    'BANK_TRANSFER',
    transfer.created_at,
    transfer.notes,
    transfer.created_by_user_id,
    transfer.created_at,
    transfer.updated_at,
    0
FROM financial_transfers transfer
WHERE transfer.destination_account_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM financial_transactions transaction
      WHERE transaction.transfer_id = transfer.id
        AND transaction.type = 'TRANSFER_IN'
  );

ALTER TABLE financial_transactions
    ADD CONSTRAINT ck_financial_transactions_transfer_state
        CHECK (
            (
                type IN ('TRANSFER_IN', 'TRANSFER_OUT')
                AND transfer_id IS NOT NULL
                AND category_id IS NULL
                AND exclude_from_reports = TRUE
                AND status = 'PAID'
            )
            OR
            (
                type NOT IN ('TRANSFER_IN', 'TRANSFER_OUT')
                AND transfer_id IS NULL
            )
        );

ALTER TABLE financial_transfers
    DROP CONSTRAINT ck_financial_transfers_type;

ALTER TABLE financial_transfers
    ADD CONSTRAINT ck_financial_transfers_type
        CHECK (
            type IN (
                'ACCOUNT_TRANSFER',
                'INVESTMENT_CONTRIBUTION',
                'INVESTMENT_REDEMPTION',
                'INVESTMENT_TRANSFER'
            )
        );

CREATE INDEX idx_financial_transactions_transfer
    ON financial_transactions(transfer_id);
