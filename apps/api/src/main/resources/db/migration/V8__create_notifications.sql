CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    family_id UUID NOT NULL,
    recipient_user_id UUID NOT NULL,
    type VARCHAR(60) NOT NULL,
    title VARCHAR(160) NOT NULL,
    message VARCHAR(500) NOT NULL,
    action_path VARCHAR(500),
    reference_id UUID,
    deduplication_key VARCHAR(200),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_notifications_family
        FOREIGN KEY (family_id)
        REFERENCES families (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notifications_recipient
        FOREIGN KEY (recipient_user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_notifications_recipient_created
    ON notifications (
        recipient_user_id,
        created_at DESC
    );

CREATE INDEX idx_notifications_family_created
    ON notifications (
        family_id,
        created_at DESC
    );

CREATE INDEX idx_notifications_recipient_unread
    ON notifications (
        recipient_user_id,
        created_at DESC
    )
    WHERE read_at IS NULL;

CREATE UNIQUE INDEX uk_notifications_recipient_deduplication
    ON notifications (
        recipient_user_id,
        deduplication_key
    )
    WHERE deduplication_key IS NOT NULL;


CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY,
    family_id UUID NOT NULL,
    user_id UUID NOT NULL,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    family_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    agenda_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    shopping_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    finance_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_notification_preferences_family
        FOREIGN KEY (family_id)
        REFERENCES families (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notification_preferences_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE,

    CONSTRAINT uk_notification_preferences_family_user
        UNIQUE (family_id, user_id)
);

CREATE INDEX idx_notification_preferences_user
    ON notification_preferences (user_id);