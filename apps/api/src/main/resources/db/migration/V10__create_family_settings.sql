CREATE TABLE family_settings (
    id UUID PRIMARY KEY,
    family_id UUID NOT NULL,
    default_currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    locale VARCHAR(20) NOT NULL DEFAULT 'pt-BR',
    week_start_day VARCHAR(10) NOT NULL DEFAULT 'MONDAY',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uk_family_settings_family
        UNIQUE (family_id),

    CONSTRAINT fk_family_settings_family
        FOREIGN KEY (family_id)
        REFERENCES families (id)
        ON DELETE CASCADE,

    CONSTRAINT ck_family_settings_currency
        CHECK (default_currency ~ '^[A-Z]{3}$'),

    CONSTRAINT ck_family_settings_locale
        CHECK (char_length(locale) BETWEEN 2 AND 20),

    CONSTRAINT ck_family_settings_week_start
        CHECK (
            week_start_day IN (
                'MONDAY',
                'SUNDAY',
                'SATURDAY'
            )
        )
);

INSERT INTO family_settings (
    id,
    family_id,
    default_currency,
    locale,
    week_start_day,
    created_at,
    updated_at,
    version
)
SELECT
    gen_random_uuid(),
    families.id,
    'BRL',
    'pt-BR',
    'MONDAY',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    0
FROM families
WHERE NOT EXISTS (
    SELECT 1
    FROM family_settings
    WHERE family_settings.family_id = families.id
);