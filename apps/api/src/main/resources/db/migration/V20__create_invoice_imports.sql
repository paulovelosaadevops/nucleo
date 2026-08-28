CREATE TABLE financial_invoice_imports (
    id UUID PRIMARY KEY,
    family_id UUID NOT NULL,
    card_id UUID NOT NULL,
    invoice_id UUID,
    original_file_name VARCHAR(180) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    parser_name VARCHAR(80) NOT NULL,
    status VARCHAR(20) NOT NULL,
    found_count INTEGER NOT NULL DEFAULT 0,
    imported_count INTEGER NOT NULL DEFAULT 0,
    ignored_count INTEGER NOT NULL DEFAULT 0,
    duplicated_count INTEGER NOT NULL DEFAULT 0,
    statement_total NUMERIC(18, 2),
    imported_total NUMERIC(18, 2),
    difference NUMERIC(18, 2),
    warning_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    error_message VARCHAR(500),
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_invoice_imports_family
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_invoice_imports_card
        FOREIGN KEY (card_id)
        REFERENCES financial_credit_cards(id),

    CONSTRAINT fk_invoice_imports_invoice
        FOREIGN KEY (invoice_id)
        REFERENCES financial_credit_card_invoices(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_invoice_imports_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    CONSTRAINT ck_invoice_imports_file_type
        CHECK (file_type IN ('CSV', 'PDF')),

    CONSTRAINT ck_invoice_imports_status
        CHECK (status IN ('PREVIEWED', 'CONFIRMED', 'ROLLED_BACK', 'FAILED'))
);

ALTER TABLE financial_credit_card_purchases
    ADD COLUMN invoice_import_id UUID;

ALTER TABLE financial_credit_card_purchases
    ADD COLUMN invoice_import_fingerprint VARCHAR(64);

ALTER TABLE financial_credit_card_purchases
    ADD CONSTRAINT fk_credit_card_purchases_invoice_import
        FOREIGN KEY (invoice_import_id)
        REFERENCES financial_invoice_imports(id)
        ON DELETE SET NULL;

CREATE INDEX idx_invoice_import_file_hash
    ON financial_invoice_imports(family_id, card_id, file_hash);

CREATE UNIQUE INDEX uk_credit_card_purchase_import_fingerprint
    ON financial_credit_card_purchases(
        family_id,
        credit_card_id,
        invoice_import_fingerprint
    )
    WHERE invoice_import_fingerprint IS NOT NULL;

CREATE INDEX idx_invoice_imports_family_card_created
    ON financial_invoice_imports(family_id, card_id, created_at DESC);

CREATE INDEX idx_credit_card_purchases_invoice_import
    ON financial_credit_card_purchases(invoice_import_id);
