CREATE TABLE accountability_group_invitations (
    id uuid PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES accountability_groups(id),
    inviter_id uuid NOT NULL REFERENCES users(id),
    target_user_id uuid NOT NULL REFERENCES users(id),
    status varchar(16) NOT NULL CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CHECK (inviter_id <> target_user_id)
);
CREATE UNIQUE INDEX uk_group_invitation_pending
    ON accountability_group_invitations(group_id, target_user_id) WHERE status = 'PENDING';
CREATE INDEX idx_group_invitation_target ON accountability_group_invitations(target_user_id, status);

