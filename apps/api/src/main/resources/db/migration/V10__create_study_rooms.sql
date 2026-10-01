CREATE TABLE study_rooms
(
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id              uuid         NOT NULL REFERENCES users (id),
    name                  varchar(80)  NOT NULL CHECK (length(trim(name)) > 0),
    focus_minutes         integer      NOT NULL CHECK (focus_minutes BETWEEN 15 AND 90),
    break_minutes         integer      NOT NULL CHECK (break_minutes BETWEEN 3 AND 30),
    long_break_minutes    integer      NOT NULL CHECK (long_break_minutes BETWEEN 10 AND 45),
    request_policy        varchar(30)  NOT NULL CHECK (request_policy IN ('AFTER_FOCUS', 'OPEN', 'HOST_ONLY')),
    minimum_study_minutes integer      NOT NULL CHECK (minimum_study_minutes BETWEEN 0 AND 120),
    closed                boolean      NOT NULL DEFAULT false,
    created_at            timestamptz  NOT NULL,
    closed_at             timestamptz,
    playback_video_id     varchar(11)  NOT NULL CHECK (playback_video_id ~ '^[A-Za-z0-9_-]{11}$'),
    playback_title        varchar(120) NOT NULL,
    playback_started_at   timestamptz  NOT NULL,
    playback_version      bigint       NOT NULL DEFAULT 0 CHECK (playback_version >= 0),
    playback_default      boolean      NOT NULL DEFAULT true
);

CREATE TABLE study_room_members
(
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id      uuid        NOT NULL REFERENCES study_rooms (id) ON DELETE CASCADE,
    user_id      uuid        NOT NULL REFERENCES users (id),
    focus_millis bigint      NOT NULL DEFAULT 0 CHECK (focus_millis >= 0),
    joined       boolean     NOT NULL DEFAULT true,
    joined_at    timestamptz NOT NULL,
    last_seen    timestamptz NOT NULL,
    CONSTRAINT uk_study_room_member UNIQUE (room_id, user_id)
);

-- A user can retain study history in many rooms, but select only one room at a time.
CREATE UNIQUE INDEX uk_study_room_selected_member ON study_room_members (user_id) WHERE joined;
CREATE INDEX idx_study_room_presence ON study_room_members (room_id, joined, last_seen);
CREATE INDEX idx_study_room_open_owner ON study_rooms (owner_id) WHERE NOT closed;
CREATE INDEX idx_study_room_listing ON study_rooms (created_at DESC) WHERE NOT closed;

CREATE TABLE study_room_tracks
(
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id      uuid         NOT NULL REFERENCES study_rooms (id) ON DELETE CASCADE,
    requested_by uuid         NOT NULL REFERENCES users (id),
    video_id     varchar(11)  NOT NULL CHECK (video_id ~ '^[A-Za-z0-9_-]{11}$'),
    title        varchar(120) NOT NULL CHECK (length(trim(title)) > 0),
    status       varchar(20)  NOT NULL CHECK (status IN ('PENDING', 'APPROVED')),
    created_at   timestamptz  NOT NULL,
    CONSTRAINT uk_study_room_outstanding_track UNIQUE (room_id, requested_by)
);

CREATE INDEX idx_study_room_queue ON study_room_tracks (room_id, created_at, id);
