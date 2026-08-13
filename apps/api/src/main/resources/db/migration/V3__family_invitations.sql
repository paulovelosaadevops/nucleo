CREATE TABLE family_invitations (
    id UUID PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES families(id),
    invited_email VARCHAR(180) NOT NULL,
    role VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_by UUID NOT NULL REFERENCES app_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_family_invitations_family_id ON family_invitations(family_id);
CREATE INDEX idx_family_invitations_invited_email ON family_invitations(invited_email);