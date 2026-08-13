ALTER TABLE family_invitations
ADD COLUMN token VARCHAR(120);

UPDATE family_invitations
SET token = gen_random_uuid()::text
WHERE token IS NULL;

ALTER TABLE family_invitations
ALTER COLUMN token SET NOT NULL;

ALTER TABLE family_invitations
ADD CONSTRAINT uk_family_invitations_token UNIQUE (token);