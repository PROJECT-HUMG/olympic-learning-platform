-- Durable accountability groups. These rows are not study-room leases.
CREATE TABLE accountability_groups
(
    id         uuid PRIMARY KEY,
    owner_id   uuid         NOT NULL,
    name       varchar(120) NOT NULL,
    created_at timestamptz  NOT NULL DEFAULT now(),
    updated_at timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT fk_accountability_group_owner FOREIGN KEY (owner_id) REFERENCES users (id)
);

CREATE TABLE accountability_group_memberships
(
    id            uuid PRIMARY KEY,
    group_id      uuid        NOT NULL,
    user_id       uuid        NOT NULL,
    status        varchar(20) NOT NULL DEFAULT 'ACTIVE',
    share_daily   boolean     NOT NULL DEFAULT false,
    sharing_mode  varchar(32) NOT NULL DEFAULT 'GROUP',
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uk_accountability_membership_group_user UNIQUE (group_id, user_id),
    CONSTRAINT fk_accountability_membership_group FOREIGN KEY (group_id) REFERENCES accountability_groups (id),
    CONSTRAINT fk_accountability_membership_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT ck_accountability_membership_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT ck_accountability_membership_mode CHECK (sharing_mode IN ('GROUP', 'SELECTED_MEMBERS'))
);

CREATE TABLE accountability_group_share_viewers
(
    id         uuid PRIMARY KEY,
    owner_id   uuid        NOT NULL,
    group_id   uuid        NOT NULL,
    viewer_id  uuid        NOT NULL,
    active     boolean     NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uk_accountability_share_viewer UNIQUE (owner_id, group_id, viewer_id),
    CONSTRAINT fk_accountability_share_viewer_owner_membership
        FOREIGN KEY (group_id, owner_id) REFERENCES accountability_group_memberships (group_id, user_id),
    CONSTRAINT fk_accountability_share_viewer_viewer_membership
        FOREIGN KEY (group_id, viewer_id) REFERENCES accountability_group_memberships (group_id, user_id),
    CONSTRAINT ck_accountability_share_viewer_distinct CHECK (owner_id <> viewer_id)
);
