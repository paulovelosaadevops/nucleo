CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY,
    family_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    due_date DATE,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_shopping_lists_family
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_shopping_lists_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    CONSTRAINT ck_shopping_lists_status
        CHECK (status IN ('ACTIVE', 'COMPLETED', 'ARCHIVED')),

    CONSTRAINT ck_shopping_lists_name
        CHECK (CHAR_LENGTH(TRIM(name)) BETWEEN 2 AND 120)
);

CREATE TABLE shopping_items (
    id UUID PRIMARY KEY,
    shopping_list_id UUID NOT NULL,
    name VARCHAR(160) NOT NULL,
    description VARCHAR(500),
    category VARCHAR(30) NOT NULL DEFAULT 'OTHER',
    quantity NUMERIC(12, 3) NOT NULL DEFAULT 1,
    unit VARCHAR(20) NOT NULL DEFAULT 'UNIT',
    estimated_unit_price NUMERIC(14, 2),
    actual_unit_price NUMERIC(14, 2),
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    assigned_to_membership_id UUID,
    checked_by_membership_id UUID,
    checked_at TIMESTAMPTZ,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_shopping_items_list
        FOREIGN KEY (shopping_list_id)
        REFERENCES shopping_lists(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_shopping_items_assigned_to
        FOREIGN KEY (assigned_to_membership_id)
        REFERENCES family_memberships(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_shopping_items_checked_by
        FOREIGN KEY (checked_by_membership_id)
        REFERENCES family_memberships(id)
        ON DELETE SET NULL,

    CONSTRAINT ck_shopping_items_name
        CHECK (CHAR_LENGTH(TRIM(name)) BETWEEN 1 AND 160),

    CONSTRAINT ck_shopping_items_category
        CHECK (
            category IN (
                'FOOD',
                'BEVERAGE',
                'HYGIENE',
                'CLEANING',
                'PHARMACY',
                'BABY',
                'PET',
                'HOUSEHOLD',
                'CLOTHING',
                'ELECTRONICS',
                'OTHER'
            )
        ),

    CONSTRAINT ck_shopping_items_quantity
        CHECK (quantity > 0),

    CONSTRAINT ck_shopping_items_unit
        CHECK (
            unit IN (
                'UNIT',
                'PACKAGE',
                'BOX',
                'BOTTLE',
                'CAN',
                'LITER',
                'MILLILITER',
                'KILOGRAM',
                'GRAM',
                'METER',
                'DOZEN'
            )
        ),

    CONSTRAINT ck_shopping_items_estimated_price
        CHECK (
            estimated_unit_price IS NULL
            OR estimated_unit_price >= 0
        ),

    CONSTRAINT ck_shopping_items_actual_price
        CHECK (
            actual_unit_price IS NULL
            OR actual_unit_price >= 0
        ),

    CONSTRAINT ck_shopping_items_priority
        CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),

    CONSTRAINT ck_shopping_items_status
        CHECK (status IN ('PENDING', 'PURCHASED', 'CANCELLED')),

    CONSTRAINT ck_shopping_items_checked_state
        CHECK (
            (
                status = 'PURCHASED'
                AND checked_at IS NOT NULL
                AND checked_by_membership_id IS NOT NULL
            )
            OR
            (
                status <> 'PURCHASED'
                AND checked_at IS NULL
                AND checked_by_membership_id IS NULL
            )
        )
);

CREATE INDEX idx_shopping_lists_family_status
    ON shopping_lists(family_id, status);

CREATE INDEX idx_shopping_lists_family_due_date
    ON shopping_lists(family_id, due_date);

CREATE INDEX idx_shopping_items_list_status
    ON shopping_items(shopping_list_id, status);

CREATE INDEX idx_shopping_items_assigned_to
    ON shopping_items(assigned_to_membership_id);

CREATE INDEX idx_shopping_items_list_sort_order
    ON shopping_items(shopping_list_id, sort_order, created_at);