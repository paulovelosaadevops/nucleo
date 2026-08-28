WITH duplicated AS (
    SELECT
        investment_id,
        movement_date,
        MIN(created_at) AS first_created_at,
        SUM(amount) AS consolidated_amount
    FROM financial_investment_movements
    WHERE movement_type = 'RECONCILIATION'
    GROUP BY investment_id, movement_date
    HAVING COUNT(*) > 1
),
ranked AS (
    SELECT
        movement.id,
        movement.investment_id,
        movement.movement_date,
        ROW_NUMBER() OVER (
            PARTITION BY movement.investment_id, movement.movement_date
            ORDER BY movement.created_at ASC, movement.id ASC
        ) AS keep_rank,
        FIRST_VALUE(movement.calculated_balance_before) OVER (
            PARTITION BY movement.investment_id, movement.movement_date
            ORDER BY movement.created_at ASC, movement.id ASC
        ) AS first_balance_before,
        FIRST_VALUE(movement.calculated_balance_after) OVER (
            PARTITION BY movement.investment_id, movement.movement_date
            ORDER BY movement.created_at DESC, movement.id DESC
        ) AS final_balance_after,
        STRING_AGG(NULLIF(TRIM(movement.notes), ''), ' | ') OVER (
            PARTITION BY movement.investment_id, movement.movement_date
        ) AS merged_notes
    FROM financial_investment_movements movement
    JOIN duplicated duplicate
      ON duplicate.investment_id = movement.investment_id
     AND duplicate.movement_date = movement.movement_date
    WHERE movement.movement_type = 'RECONCILIATION'
),
updated AS (
    UPDATE financial_investment_movements movement
       SET amount = duplicate.consolidated_amount,
           calculated_balance_before = ranked.first_balance_before,
           calculated_balance_after = ranked.final_balance_after,
           notes = LEFT(ranked.merged_notes, 1000),
           version = movement.version + 1
      FROM duplicated duplicate
      JOIN ranked ranked
        ON ranked.investment_id = duplicate.investment_id
       AND ranked.movement_date = duplicate.movement_date
       AND ranked.keep_rank = 1
     WHERE movement.id = ranked.id
    RETURNING movement.id
)
DELETE FROM financial_investment_movements movement
USING ranked ranked
WHERE movement.id = ranked.id
  AND ranked.keep_rank > 1;

CREATE UNIQUE INDEX uk_investment_daily_reconciliation
    ON financial_investment_movements(investment_id, movement_date)
    WHERE movement_type = 'RECONCILIATION';
