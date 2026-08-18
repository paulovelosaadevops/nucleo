CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT ck_users_name_not_blank
        CHECK (length(trim(name)) >= 2),

    CONSTRAINT ck_users_email_not_blank
        CHECK (length(trim(email)) >= 3),

    CONSTRAINT ck_users_status
        CHECK (status IN ('ACTIVE', 'BLOCKED', 'DISABLED'))
);

CREATE UNIQUE INDEX ux_users_email
    ON users (lower(email));


CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_families_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users (id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_families_name_not_blank
        CHECK (length(trim(name)) >= 2)
);

CREATE INDEX ix_families_created_by
    ON families (created_by_user_id);


CREATE TABLE family_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_family_memberships_family
        FOREIGN KEY (family_id)
        REFERENCES families (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_family_memberships_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE,

    CONSTRAINT uq_family_memberships_family_user
        UNIQUE (family_id, user_id),

    CONSTRAINT uq_family_memberships_user
        UNIQUE (user_id),

    CONSTRAINT ck_family_memberships_role
        CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),

    CONSTRAINT ck_family_memberships_status
        CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX ix_family_memberships_family
    ON family_memberships (family_id);


CREATE TABLE family_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL,
    email VARCHAR(254) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    token_hash CHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    invited_by_user_id UUID NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_family_invitations_family
        FOREIGN KEY (family_id)
        REFERENCES families (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_family_invitations_invited_by
        FOREIGN KEY (invited_by_user_id)
        REFERENCES users (id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_family_invitations_token_hash
        UNIQUE (token_hash),

    CONSTRAINT ck_family_invitations_role
        CHECK (role IN ('ADMIN', 'MEMBER')),

    CONSTRAINT ck_family_invitations_status
        CHECK (
            status IN (
                'PENDING',
                'ACCEPTED',
                'DECLINED',
                'REVOKED',
                'EXPIRED'
            )
        )
);

CREATE UNIQUE INDEX ux_family_invitations_pending_email
    ON family_invitations (family_id, lower(email))
    WHERE status = 'PENDING';

CREATE INDEX ix_family_invitations_email
    ON family_invitations (lower(email));

CREATE INDEX ix_family_invitations_expires_at
    ON family_invitations (expires_at)
    WHERE status = 'PENDING';


CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    replaced_by_token_id UUID,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_refresh_tokens_replacement
        FOREIGN KEY (replaced_by_token_id)
        REFERENCES refresh_tokens (id)
        ON DELETE SET NULL,

    CONSTRAINT ux_refresh_tokens_token_hash
        UNIQUE (token_hash),

    CONSTRAINT ck_refresh_tokens_expiration
        CHECK (expires_at > created_at)
);

CREATE INDEX ix_refresh_tokens_user
    ON refresh_tokens (user_id);

CREATE INDEX ix_refresh_tokens_active
    ON refresh_tokens (user_id, expires_at)
    WHERE revoked_at IS NULL;