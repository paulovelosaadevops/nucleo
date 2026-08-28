UPDATE financial_categories
SET color = CASE
    WHEN type = 'INCOME' THEN '#34D399'
    WHEN LOWER(TRIM(name)) IN ('alimentacao', 'alimentação', 'mercado', 'supermercado') THEN '#2DD4BF'
    WHEN LOWER(TRIM(name)) IN ('moradia', 'casa', 'aluguel') THEN '#A78BFA'
    WHEN LOWER(TRIM(name)) IN ('transporte', 'combustivel', 'combustível') THEN '#38BDF8'
    WHEN LOWER(TRIM(name)) IN ('saude', 'saúde') THEN '#FB7185'
    WHEN LOWER(TRIM(name)) IN ('educacao', 'educação') THEN '#FBBF24'
    WHEN LOWER(TRIM(name)) IN ('lazer', 'entretenimento') THEN '#F472B6'
    WHEN LOWER(TRIM(name)) IN ('compras', 'shopping') THEN '#C084FC'
    WHEN LOWER(TRIM(name)) IN ('servicos', 'serviços', 'assinaturas') THEN '#60A5FA'
    WHEN LOWER(TRIM(name)) IN ('taxas e encargos', 'taxas', 'encargos', 'juros') THEN '#94A3B8'
    ELSE '#8f8f99'
END
WHERE color IS NULL OR TRIM(color) = '';
