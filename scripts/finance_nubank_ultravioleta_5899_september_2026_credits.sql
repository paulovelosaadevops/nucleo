-- Idempotent production script for Nubank Ultravioleta final 5899,
-- September 2026 invoice.
-- Do not run automatically. Review and execute manually in production.

DO $$
DECLARE
    v_card_id UUID;
    v_family_id UUID;
    v_created_by_user_id UUID;
    v_invoice_id UUID;
    v_now TIMESTAMPTZ := now();
    v_gross_debits NUMERIC(18, 2);
    v_net_total NUMERIC(18, 2);
BEGIN
    SELECT card.id,
           card.family_id,
           card.created_by_user_id
      INTO v_card_id,
           v_family_id,
           v_created_by_user_id
      FROM financial_credit_cards card
     WHERE lower(card.name) = lower('Nubank Ultravioleta')
       AND card.last_four = '5899';

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Cartao Nubank Ultravioleta final 5899 nao encontrado';
    END IF;

    IF (
        SELECT count(*)
          FROM financial_credit_cards card
         WHERE lower(card.name) = lower('Nubank Ultravioleta')
           AND card.last_four = '5899'
    ) <> 1 THEN
        RAISE EXCEPTION
            'Cartao Nubank Ultravioleta final 5899 nao encontrado de forma unica';
    END IF;

    SELECT invoice.id
      INTO v_invoice_id
      FROM financial_credit_card_invoices invoice
     WHERE invoice.credit_card_id = v_card_id
       AND invoice.reference_month = DATE '2026-09-01';

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Fatura de setembro de 2026 nao encontrada para o cartao %',
            v_card_id;
    END IF;

    IF (
        SELECT count(*)
          FROM financial_credit_card_invoices invoice
         WHERE invoice.credit_card_id = v_card_id
           AND invoice.reference_month = DATE '2026-09-01'
    ) <> 1 THEN
        RAISE EXCEPTION
            'Fatura de setembro de 2026 nao encontrada de forma unica';
    END IF;

    CREATE TEMP TABLE tmp_nubank_5899_sep_2026_credits (
        note_key TEXT PRIMARY KEY,
        purchase_date DATE NOT NULL,
        description VARCHAR(160) NOT NULL,
        amount NUMERIC(18, 2) NOT NULL
    ) ON COMMIT DROP;

    INSERT INTO tmp_nubank_5899_sep_2026_credits
        (note_key, purchase_date, description, amount)
    VALUES
        ('nucleo:nubank-5899:2026-09:credit:iof-base44:2026-07-28',
         DATE '2026-07-28', 'IOF de volta de Base44', 5.56),
        ('nucleo:nubank-5899:2026-09:credit:iof-base44:2026-08-05',
         DATE '2026-08-05', 'IOF de volta de Base44', 5.55),
        ('nucleo:nubank-5899:2026-09:credit:estorno-shopee-jacquero-modas',
         DATE '2026-08-05', 'Estorno Shopee Jacquero Modas', 26.32),
        ('nucleo:nubank-5899:2026-09:credit:estorno-shopee-sgbmodaevaried',
         DATE '2026-08-09', 'Estorno Shopee Sgbmodaevaried', 21.90),
        ('nucleo:nubank-5899:2026-09:credit:estorno-shopee-dnc-moda-e-vari',
         DATE '2026-08-09', 'Estorno Shopee Dnc Moda e Vari', 21.90),
        ('nucleo:nubank-5899:2026-09:credit:iof-base44:2026-08-14',
         DATE '2026-08-14', 'IOF de volta de Base44', 2.82),
        ('nucleo:nubank-5899:2026-09:credit:iof-vercel:2026-08-15',
         DATE '2026-08-15', 'IOF de volta de Vercel', 5.68),
        ('nucleo:nubank-5899:2026-09:credit:estorno-shopee-fevitstore',
         DATE '2026-08-16', 'Estorno Shopee Fevitstore', 51.90),
        ('nucleo:nubank-5899:2026-09:credit:iof-openai:2026-08-16',
         DATE '2026-08-16', 'IOF de volta de OpenAI', 3.63),
        ('nucleo:nubank-5899:2026-09:credit:conciliacao-nubank:centavo',
         DATE '2026-08-16',
         'Ajuste de conciliacao Nubank - diferenca estornos e descontos',
         -0.01);

    IF (
        SELECT sum(amount)
          FROM tmp_nubank_5899_sep_2026_credits
    ) <> 145.25 THEN
        RAISE EXCEPTION
            'Total liquido dos creditos nao fecha em 145,25';
    END IF;

    WITH inserted_purchases AS (
        INSERT INTO financial_credit_card_purchases (
            id,
            family_id,
            credit_card_id,
            category_id,
            description,
            total_amount,
            purchase_type,
            purchase_date,
            total_installments,
            status,
            notes,
            created_by_user_id,
            created_at,
            updated_at,
            version
        )
        SELECT gen_random_uuid(),
               v_family_id,
               v_card_id,
               NULL,
               source.description,
               abs(source.amount),
               CASE WHEN source.amount < 0 THEN 'DEBIT' ELSE 'CREDIT' END,
               source.purchase_date,
               1,
               'ACTIVE',
               source.note_key,
               v_created_by_user_id,
               v_now,
               v_now,
               0
          FROM tmp_nubank_5899_sep_2026_credits source
         WHERE NOT EXISTS (
               SELECT 1
                 FROM financial_credit_card_purchases existing
                WHERE existing.notes = source.note_key
                  AND existing.credit_card_id = v_card_id
         )
        RETURNING id, notes, total_amount
    )
    INSERT INTO financial_credit_card_installments (
        id,
        purchase_id,
        invoice_id,
        installment_number,
        amount,
        status,
        created_at,
        updated_at,
        version
    )
    SELECT gen_random_uuid(),
           purchase.id,
           v_invoice_id,
           1,
           purchase.total_amount,
           'OPEN',
           v_now,
           v_now,
           0
      FROM inserted_purchases purchase
     WHERE NOT EXISTS (
           SELECT 1
             FROM financial_credit_card_installments installment
             JOIN financial_credit_card_purchases existing_purchase
               ON existing_purchase.id = installment.purchase_id
            WHERE installment.invoice_id = v_invoice_id
              AND existing_purchase.notes = purchase.notes
     );

    SELECT coalesce(sum(installment.amount), 0)
      INTO v_gross_debits
      FROM financial_credit_card_installments installment
      JOIN financial_credit_card_purchases purchase
        ON purchase.id = installment.purchase_id
     WHERE installment.invoice_id = v_invoice_id
       AND installment.status = 'OPEN'
       AND purchase.status = 'ACTIVE'
       AND purchase.purchase_type = 'DEBIT';

    SELECT coalesce(sum(
               CASE
                   WHEN purchase.purchase_type = 'CREDIT'
                   THEN -installment.amount
                   ELSE installment.amount
               END
           ), 0)
      INTO v_net_total
      FROM financial_credit_card_installments installment
      JOIN financial_credit_card_purchases purchase
        ON purchase.id = installment.purchase_id
     WHERE installment.invoice_id = v_invoice_id
       AND installment.status = 'OPEN'
       AND purchase.status = 'ACTIVE';

    IF v_gross_debits <> 8556.94 THEN
        RAISE NOTICE
            'Gastos brutos atuais: %, esperado no cenario informado: 8556.94',
            v_gross_debits;
    END IF;

    IF v_net_total <> 8411.69 THEN
        RAISE EXCEPTION
            'Total liquido calculado % diverge do esperado 8411.69',
            v_net_total;
    END IF;
END $$;

SELECT purchase.purchase_date,
       purchase.description,
       purchase.purchase_type,
       CASE
           WHEN purchase.purchase_type = 'CREDIT'
           THEN -installment.amount
           ELSE installment.amount
       END AS signed_amount,
       purchase.notes
  FROM financial_credit_card_purchases purchase
  JOIN financial_credit_card_installments installment
    ON installment.purchase_id = purchase.id
  JOIN financial_credit_card_invoices invoice
    ON invoice.id = installment.invoice_id
  JOIN financial_credit_cards card
    ON card.id = invoice.credit_card_id
 WHERE lower(card.name) = lower('Nubank Ultravioleta')
   AND card.last_four = '5899'
   AND invoice.reference_month = DATE '2026-09-01'
   AND purchase.notes LIKE 'nucleo:nubank-5899:2026-09:%'
 ORDER BY purchase.purchase_date,
          purchase.description;

SELECT coalesce(sum(
           CASE
               WHEN purchase.purchase_type = 'CREDIT'
               THEN -installment.amount
               ELSE installment.amount
           END
       ), 0) AS invoice_total
  FROM financial_credit_card_installments installment
  JOIN financial_credit_card_purchases purchase
    ON purchase.id = installment.purchase_id
  JOIN financial_credit_card_invoices invoice
    ON invoice.id = installment.invoice_id
  JOIN financial_credit_cards card
    ON card.id = invoice.credit_card_id
 WHERE lower(card.name) = lower('Nubank Ultravioleta')
   AND card.last_four = '5899'
   AND invoice.reference_month = DATE '2026-09-01'
   AND installment.status = 'OPEN'
   AND purchase.status = 'ACTIVE';
