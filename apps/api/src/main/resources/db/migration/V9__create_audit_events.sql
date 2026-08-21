CREATE TABLE audit_events (
    id UUID PRIMARY KEY,
    family_id UUID NOT NULL,
    actor_user_id UUID,
    action VARCHAR(60) NOT NULL,
    resource_type VARCHAR(60) NOT NULL,
    resource_id UUID,
    description VARCHAR(500) NOT NULL,
    metadata_json TEXT,
    ip_address VARCHAR(64),
    user_agent VARCHAR(500),
    occurred_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT fk_audit_events_family
        FOREIGN KEY (family_id)
        REFERENCES families (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_audit_events_actor
        FOREIGN KEY (actor_user_id)
        REFERENCES users (id)
        ON DELETE SET NULL
);

CREATE INDEX idx_audit_events_family_occurred
    ON audit_events (
        family_id,
        occurred_at DESC
    );

CREATE INDEX idx_audit_events_actor_occurred
    ON audit_events (
        actor_user_id,
        occurred_at DESC
    );

CREATE INDEX idx_audit_events_resource
    ON audit_events (
        family_id,
        resource_type,
        resource_id
    );

CREATE INDEX idx_audit_events_action
    ON audit_events (
        family_id,
        action,
        occurred_at DESC
    );