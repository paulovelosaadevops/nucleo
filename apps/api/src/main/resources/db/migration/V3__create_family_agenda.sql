ALTER TABLE families
    ADD COLUMN time_zone VARCHAR(50)
    NOT NULL
    DEFAULT 'America/Sao_Paulo';


CREATE TABLE agenda_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL,
    title VARCHAR(160) NOT NULL,
    description VARCHAR(2000),
    category VARCHAR(30) NOT NULL DEFAULT 'OTHER',
    location VARCHAR(255),
    all_day BOOLEAN NOT NULL DEFAULT FALSE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    assigned_to_membership_id UUID,
    created_by_user_id UUID NOT NULL,

    recurrence_frequency VARCHAR(20) NOT NULL DEFAULT 'NONE',
    recurrence_interval INTEGER NOT NULL DEFAULT 1,
    recurrence_days_of_week VARCHAR(100),
    recurrence_until TIMESTAMPTZ,
    recurrence_count INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_agenda_events_family
        FOREIGN KEY (family_id)
        REFERENCES families (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_agenda_events_assigned_membership
        FOREIGN KEY (assigned_to_membership_id)
        REFERENCES family_memberships (id)
        ON DELETE SET NULL,

    CONSTRAINT fk_agenda_events_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users (id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_agenda_events_title
        CHECK (length(trim(title)) BETWEEN 2 AND 160),

    CONSTRAINT ck_agenda_events_category
        CHECK (
            category IN (
                'APPOINTMENT',
                'HEALTH',
                'SCHOOL',
                'FAMILY',
                'PERSONAL',
                'BIRTHDAY',
                'TASK',
                'OTHER'
            )
        ),

    CONSTRAINT ck_agenda_events_dates
        CHECK (
            ends_at IS NULL
            OR ends_at > starts_at
        ),

    CONSTRAINT ck_agenda_events_recurrence_frequency
        CHECK (
            recurrence_frequency IN (
                'NONE',
                'DAILY',
                'WEEKLY',
                'MONTHLY',
                'YEARLY'
            )
        ),

    CONSTRAINT ck_agenda_events_recurrence_interval
        CHECK (
            recurrence_interval BETWEEN 1 AND 365
        ),

    CONSTRAINT ck_agenda_events_recurrence_count
        CHECK (
            recurrence_count IS NULL
            OR recurrence_count BETWEEN 1 AND 500
        ),

    CONSTRAINT ck_agenda_events_recurrence_until
        CHECK (
            recurrence_until IS NULL
            OR recurrence_until >= starts_at
        ),

    CONSTRAINT ck_agenda_events_non_recurring
        CHECK (
            recurrence_frequency <> 'NONE'
            OR (
                recurrence_days_of_week IS NULL
                AND recurrence_until IS NULL
                AND recurrence_count IS NULL
            )
        )
);

CREATE INDEX ix_agenda_events_family
    ON agenda_events (family_id);

CREATE INDEX ix_agenda_events_assigned_membership
    ON agenda_events (assigned_to_membership_id);

CREATE INDEX ix_agenda_events_created_by
    ON agenda_events (created_by_user_id);


CREATE TABLE agenda_event_occurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    occurrence_starts_at TIMESTAMPTZ NOT NULL,
    occurrence_ends_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    status_changed_by_user_id UUID,
    notes VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_agenda_occurrences_event
        FOREIGN KEY (event_id)
        REFERENCES agenda_events (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_agenda_occurrences_status_user
        FOREIGN KEY (status_changed_by_user_id)
        REFERENCES users (id)
        ON DELETE SET NULL,

    CONSTRAINT uq_agenda_occurrences_event_start
        UNIQUE (event_id, occurrence_starts_at),

    CONSTRAINT ck_agenda_occurrences_dates
        CHECK (
            occurrence_ends_at IS NULL
            OR occurrence_ends_at > occurrence_starts_at
        ),

    CONSTRAINT ck_agenda_occurrences_status
        CHECK (
            status IN (
                'SCHEDULED',
                'COMPLETED',
                'CANCELLED'
            )
        ),

    CONSTRAINT ck_agenda_occurrences_completion
        CHECK (
            status = 'COMPLETED'
            OR completed_at IS NULL
        ),

    CONSTRAINT ck_agenda_occurrences_cancellation
        CHECK (
            status = 'CANCELLED'
            OR cancelled_at IS NULL
        )
);

CREATE INDEX ix_agenda_occurrences_period
    ON agenda_event_occurrences (
        occurrence_starts_at,
        occurrence_ends_at
    );

CREATE INDEX ix_agenda_occurrences_status
    ON agenda_event_occurrences (status);

CREATE INDEX ix_agenda_occurrences_event
    ON agenda_event_occurrences (event_id);


CREATE TABLE agenda_event_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    minutes_before INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_agenda_reminders_event
        FOREIGN KEY (event_id)
        REFERENCES agenda_events (id)
        ON DELETE CASCADE,

    CONSTRAINT uq_agenda_reminders_event_minutes
        UNIQUE (event_id, minutes_before),

    CONSTRAINT ck_agenda_reminders_minutes
        CHECK (
            minutes_before BETWEEN 0 AND 10080
        )
);

CREATE INDEX ix_agenda_reminders_event
    ON agenda_event_reminders (event_id);