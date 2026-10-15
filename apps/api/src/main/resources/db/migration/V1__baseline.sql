-- Fresh-install baseline consolidated from the unapplied V1-V24 history.
-- No upgrade/reset of an existing database is implied. Subsequent changes are append-only.

-- Users and file metadata
CREATE TYPE user_role AS ENUM ('STUDENT', 'LECTURER', 'ADMIN');
CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'DISABLED');

CREATE TABLE files
(
    id            uuid PRIMARY KEY      DEFAULT gen_random_uuid(),
    storage_key   varchar(512) NOT NULL,
    original_name varchar(255) NOT NULL,
    content_type  varchar(100) NOT NULL,
    size          bigint       NOT NULL,
    provider      varchar(50)  NOT NULL,
    folder        varchar(50)  NOT NULL,
    created_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_files_storage_key ON files (storage_key);

CREATE TABLE users
(
    id            uuid PRIMARY KEY      DEFAULT gen_random_uuid(),
    email         varchar(100) NOT NULL,
    username      varchar(100) NOT NULL,
    role          user_role    NOT NULL DEFAULT 'STUDENT',
    status        user_status  NOT NULL DEFAULT 'PENDING',
    full_name     varchar(255),
    password_hash varchar(255),
    avatar_id     uuid,
    last_login_at timestamptz,
    deleted_at    timestamptz,
    updated_at    timestamptz  NOT NULL DEFAULT now(),
    created_at    timestamptz  NOT NULL DEFAULT now(),
    avatar_crop_x double precision,
    avatar_crop_y double precision,
    avatar_crop_zoom double precision,
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT fk_users_avatar_id FOREIGN KEY (avatar_id) REFERENCES files (id),
    CONSTRAINT users_avatar_crop_valid CHECK (
        (avatar_crop_x IS NULL AND avatar_crop_y IS NULL AND avatar_crop_zoom IS NULL)
        OR (avatar_crop_x IS NOT NULL AND avatar_crop_y IS NOT NULL AND avatar_crop_zoom IS NOT NULL
            AND avatar_crop_x BETWEEN 0 AND 1 AND avatar_crop_y BETWEEN 0 AND 1
            AND avatar_crop_zoom BETWEEN 1 AND 3)
    )
);

CREATE UNIQUE INDEX idx_users_email_active_lower ON users (lower(email)) WHERE deleted_at IS NULL;

-- Account tokens
CREATE TYPE auth_email_token_purpose AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'ADMIN_INVITE');
CREATE TYPE auth_email_token_status AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'REVOKED');
CREATE TYPE auth_refresh_token_status AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

CREATE TABLE auth_email_tokens
(
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid                     NOT NULL,
    token_hash varchar(255)             NOT NULL,
    purpose    auth_email_token_purpose NOT NULL,
    status     auth_email_token_status  NOT NULL,
    issued_at  timestamptz              NOT NULL,
    expires_at timestamptz              NOT NULL,
    used_at    timestamptz,
    revoked_at timestamptz,
    created_ip varchar(255),
    user_agent varchar(1024),
    CONSTRAINT fk_auth_email_tokens_user_id FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_auth_email_tokens_token_hash ON auth_email_tokens (token_hash);

CREATE TABLE auth_refresh_tokens
(
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid                      NOT NULL,
    token_hash varchar(255)              NOT NULL,
    family_id  uuid                      NOT NULL,
    status     auth_refresh_token_status NOT NULL,
    issued_at  timestamptz               NOT NULL,
    expires_at timestamptz               NOT NULL,
    rotated_at timestamptz,
    revoked_at timestamptz,
    created_ip varchar(255),
    user_agent varchar(1024),
    CONSTRAINT fk_auth_refresh_tokens_user_id FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_auth_refresh_tokens_token_hash ON auth_refresh_tokens (token_hash);
CREATE INDEX idx_auth_refresh_tokens_family_id ON auth_refresh_tokens (family_id);

-- Document library
CREATE TABLE document_categories
(
    id          uuid PRIMARY KEY      DEFAULT gen_random_uuid(),
    code        varchar(100) NOT NULL,
    name        varchar(255) NOT NULL,
    slug        varchar(255) NOT NULL,
    description text,
    enabled     boolean      NOT NULL DEFAULT true,
    updated_at  timestamptz  NOT NULL DEFAULT now(),
    created_at  timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT uk_document_categories_code UNIQUE (code),
    CONSTRAINT uk_document_categories_slug UNIQUE (slug)
);

CREATE TABLE subjects
(
    id          uuid PRIMARY KEY      DEFAULT gen_random_uuid(),
    code        varchar(100) NOT NULL,
    name        varchar(255) NOT NULL,
    slug        varchar(255) NOT NULL,
    description text,
    enabled     boolean      NOT NULL DEFAULT true,
    updated_at  timestamptz  NOT NULL DEFAULT now(),
    created_at  timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT uk_subjects_code UNIQUE (code),
    CONSTRAINT uk_subjects_slug UNIQUE (slug)
);

CREATE TABLE tags
(
    id         uuid PRIMARY KEY      DEFAULT gen_random_uuid(),
    code       varchar(100) NOT NULL,
    name       varchar(255) NOT NULL,
    slug       varchar(255) NOT NULL,
    enabled    boolean      NOT NULL DEFAULT true,
    updated_at timestamptz  NOT NULL DEFAULT now(),
    created_at timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT uk_tags_code UNIQUE (code),
    CONSTRAINT uk_tags_slug UNIQUE (slug)
);

CREATE TABLE documents
(
    id             uuid PRIMARY KEY      DEFAULT gen_random_uuid(),

    title          varchar(255) NOT NULL,
    slug           varchar(255) NOT NULL,
    description    text,
    search_text    text,

    file_id        uuid         NOT NULL,

    category_id    uuid         NOT NULL,
    subject_id     uuid         NOT NULL,
    owner_id       uuid         NOT NULL,

    view_count     bigint       NOT NULL DEFAULT 0,
    download_count bigint       NOT NULL DEFAULT 0,

    deleted_at     timestamptz,
    updated_at     timestamptz  NOT NULL DEFAULT now(),
    created_at     timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT uk_documents_slug UNIQUE (slug),

    CONSTRAINT uk_documents_file UNIQUE (file_id),

    CONSTRAINT fk_documents_file_id
        FOREIGN KEY (file_id)
            REFERENCES files (id),

    CONSTRAINT fk_documents_category_id
        FOREIGN KEY (category_id)
            REFERENCES document_categories (id),

    CONSTRAINT fk_documents_subject_id
        FOREIGN KEY (subject_id)
            REFERENCES subjects (id),

    CONSTRAINT fk_documents_owner_id
        FOREIGN KEY (owner_id)
            REFERENCES users (id)
);

CREATE TABLE document_tags
(
    document_id uuid NOT NULL,
    tag_id      uuid NOT NULL,

    PRIMARY KEY (document_id, tag_id),

    CONSTRAINT fk_document_tags_document_id
        FOREIGN KEY (document_id)
            REFERENCES documents (id),

    CONSTRAINT fk_document_tags_tag_id
        FOREIGN KEY (tag_id)
            REFERENCES tags (id)
);

CREATE INDEX idx_documents_title
    ON documents (title);

CREATE INDEX idx_documents_slug
    ON documents (slug);

CREATE INDEX idx_documents_subject_id
    ON documents (subject_id);

CREATE INDEX idx_documents_category_id
    ON documents (category_id);

CREATE INDEX idx_documents_owner_id
    ON documents (owner_id);

CREATE INDEX idx_documents_deleted_at
    ON documents (deleted_at);

CREATE INDEX idx_document_tags_tag_id
    ON document_tags (tag_id);

-- User permissions
CREATE TABLE user_permissions (
    user_id UUID NOT NULL,
    permission VARCHAR(255) NOT NULL,
    PRIMARY KEY (user_id, permission),
    CONSTRAINT fk_user_permissions_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_user_permissions_user_id ON user_permissions (user_id);

-- News and publication
CREATE TYPE post_type AS ENUM (
    'NEWS',
    'ANNOUNCEMENT',
    'BLOG'
);

CREATE TYPE post_status AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);

CREATE TABLE posts
(
    id            uuid PRIMARY KEY      DEFAULT gen_random_uuid(),

    title         varchar(255) NOT NULL,
    slug          varchar(255) NOT NULL,

    summary       text,

    content       text         NOT NULL,

    thumbnail_id  uuid,

    type          post_type    NOT NULL,

    status        post_status  NOT NULL DEFAULT 'DRAFT',

    published_at  timestamptz,

    expired_at    timestamptz,

    view_count    bigint       NOT NULL DEFAULT 0,

    author_id     uuid         NOT NULL,

    deleted_at    timestamptz,

    updated_at    timestamptz  NOT NULL DEFAULT now(),

    created_at    timestamptz  NOT NULL DEFAULT now(),

    is_pinned boolean NOT NULL DEFAULT false,

    CONSTRAINT uk_posts_slug
        UNIQUE (slug),

    CONSTRAINT fk_posts_thumbnail_id
        FOREIGN KEY (thumbnail_id)
            REFERENCES files (id),

    CONSTRAINT fk_posts_author_id
        FOREIGN KEY (author_id)
            REFERENCES users (id)
);

CREATE INDEX idx_posts_published
    ON posts (status, published_at DESC);

CREATE INDEX idx_posts_public_active
    ON posts (status, published_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_posts_pinned_active
    ON posts (is_pinned, published_at DESC)
    WHERE deleted_at IS NULL AND is_pinned = true;

-- Assessment imports
CREATE TABLE assessment_imports
(
    id              uuid PRIMARY KEY      DEFAULT gen_random_uuid(),
    source_file_id  uuid         NOT NULL,
    created_by      uuid         NOT NULL,
    status          varchar(40)  NOT NULL,
    phase           varchar(40)  NOT NULL,
    progress        integer      NOT NULL DEFAULT 0,
    total_pages     integer      NOT NULL DEFAULT 0,
    processed_pages integer      NOT NULL DEFAULT 0,
    draft_count     integer      NOT NULL DEFAULT 0,
    warning_count   integer      NOT NULL DEFAULT 0,
    attempt_count   integer      NOT NULL DEFAULT 0,
    last_error      text,
    lease_until     timestamptz,
    created_at      timestamptz  NOT NULL DEFAULT now(),
    updated_at      timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT fk_assessment_import_source_file
        FOREIGN KEY (source_file_id) REFERENCES files (id),
    CONSTRAINT fk_assessment_import_created_by
        FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE TABLE assessment_import_pages
(
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    import_id   uuid        NOT NULL,
    page_number integer     NOT NULL,
    file_id     uuid        NOT NULL,
    width       integer     NOT NULL,
    height      integer     NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uk_assessment_import_page UNIQUE (import_id, page_number),
    CONSTRAINT fk_assessment_import_page_import
        FOREIGN KEY (import_id) REFERENCES assessment_imports (id) ON DELETE CASCADE,
    CONSTRAINT fk_assessment_import_page_file
        FOREIGN KEY (file_id) REFERENCES files (id)
);

CREATE TABLE assessment_question_drafts
(
    id                 uuid PRIMARY KEY      DEFAULT gen_random_uuid(),
    import_id          uuid         NOT NULL,
    ordinal            integer      NOT NULL,
    status             varchar(30)  NOT NULL DEFAULT 'NEEDS_REVIEW',
    content_json       jsonb        NOT NULL DEFAULT '{}'::jsonb,
    answer_json        jsonb        NOT NULL DEFAULT '{}'::jsonb,
    parser_payload_json jsonb       NOT NULL DEFAULT '{}'::jsonb,
    confidence         numeric(5,4),
    warnings_json      jsonb        NOT NULL DEFAULT '[]'::jsonb,
    source_page        integer,
    source_bbox        jsonb,
    created_at         timestamptz  NOT NULL DEFAULT now(),
    updated_at         timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT uk_assessment_question_draft_ordinal UNIQUE (import_id, ordinal),
    CONSTRAINT fk_assessment_question_draft_import
        FOREIGN KEY (import_id) REFERENCES assessment_imports (id) ON DELETE CASCADE
);

CREATE TABLE assessment_question_draft_assets
(
    id          uuid PRIMARY KEY      DEFAULT gen_random_uuid(),
    draft_id    uuid         NOT NULL,
    file_id     uuid         NOT NULL,
    role        varchar(40)  NOT NULL,
    sort_order  integer      NOT NULL DEFAULT 0,
    alt_text    varchar(500),
    crop_json   jsonb        NOT NULL DEFAULT '{}'::jsonb,
    created_at  timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT fk_assessment_question_asset_draft
        FOREIGN KEY (draft_id) REFERENCES assessment_question_drafts (id) ON DELETE CASCADE,
    CONSTRAINT fk_assessment_question_asset_file
        FOREIGN KEY (file_id) REFERENCES files (id)
);

CREATE INDEX idx_assessment_import_created_by ON assessment_imports (created_by);
CREATE INDEX idx_assessment_import_status ON assessment_imports (status);
CREATE INDEX idx_assessment_draft_import ON assessment_question_drafts (import_id);

-- Question bank
CREATE TABLE topics
(
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id uuid         NOT NULL,
    name       varchar(255) NOT NULL,
    slug       varchar(255) NOT NULL,
    enabled    boolean      NOT NULL DEFAULT true,
    created_at timestamptz  NOT NULL DEFAULT now(),
    updated_at timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uk_topic_subject_slug UNIQUE (subject_id, slug),
    CONSTRAINT fk_topic_subject FOREIGN KEY (subject_id) REFERENCES subjects (id)
);

CREATE TABLE questions
(
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id        uuid         NOT NULL,
    topic_id          uuid         NOT NULL,
    created_by        uuid         NOT NULL,
    source_draft_id   uuid,
    status            varchar(30)  NOT NULL DEFAULT 'DRAFT',
    type              varchar(80)  NOT NULL,
    content_json      jsonb        NOT NULL DEFAULT '{}'::jsonb,
    answer_json       jsonb        NOT NULL DEFAULT '{}'::jsonb,
    difficulty        varchar(30),
    explanation_json  jsonb        NOT NULL DEFAULT '{}'::jsonb,
    published_at      timestamptz,
    archived_at       timestamptz,
    created_at        timestamptz  NOT NULL DEFAULT now(),
    updated_at        timestamptz  NOT NULL DEFAULT now(),
    version           bigint       NOT NULL DEFAULT 0,
    CONSTRAINT fk_question_subject FOREIGN KEY (subject_id) REFERENCES subjects (id),
    CONSTRAINT fk_question_topic FOREIGN KEY (topic_id) REFERENCES topics (id),
    CONSTRAINT fk_question_creator FOREIGN KEY (created_by) REFERENCES users (id),
    CONSTRAINT fk_question_source_draft FOREIGN KEY (source_draft_id) REFERENCES assessment_question_drafts (id)
);

CREATE UNIQUE INDEX uk_question_source_draft ON questions (source_draft_id) WHERE source_draft_id IS NOT NULL;

CREATE TABLE question_assets
(
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id  uuid        NOT NULL,
    file_id      uuid        NOT NULL,
    role         varchar(40) NOT NULL,
    sort_order   integer     NOT NULL DEFAULT 0,
    alt_text     varchar(500),
    crop_json    jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_question_asset_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
    CONSTRAINT fk_question_asset_file FOREIGN KEY (file_id) REFERENCES files (id)
);

CREATE INDEX idx_topic_subject_enabled ON topics (subject_id, enabled);
CREATE INDEX idx_question_status ON questions (status);
CREATE INDEX idx_question_subject_topic ON questions (subject_id, topic_id);
CREATE INDEX idx_question_creator ON questions (created_by);

-- Study rooms
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
    playback_default      boolean      NOT NULL DEFAULT true,
    timeline_started_at   timestamptz  NOT NULL DEFAULT now(),
    rhythm_version        bigint       NOT NULL DEFAULT 0,
    CONSTRAINT ck_study_room_rhythm_version CHECK (rhythm_version >= 0)
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

-- Registration OTP
CREATE TABLE auth_registration_challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES users(id),
    session_hash varchar(64) NOT NULL UNIQUE,
    code_hash varchar(64) NOT NULL,
    email varchar(100) NOT NULL,
    expires_at timestamptz NOT NULL,
    session_expires_at timestamptz NOT NULL,
    resend_available_at timestamptz NOT NULL,
    failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts BETWEEN 0 AND 5),
    verified_at timestamptz
);
CREATE TABLE auth_registration_rate_limits (
    bucket_key varchar(64) PRIMARY KEY,
    hits integer NOT NULL CHECK (hits > 0),
    expires_at timestamptz NOT NULL
);
CREATE INDEX idx_registration_rate_limits_expiry ON auth_registration_rate_limits(expires_at);

-- Recognition and academic achievements
-- Honorary memories are deliberately independent of academic achievements and scoring.
CREATE TABLE recognition_honors (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 1900 AND 2100),
  description VARCHAR(10000),
  scope VARCHAR(30) NOT NULL CHECK (scope IN ('SCHOOL','NATIONAL','INTERNATIONAL','OTHER')),
  status VARCHAR(30) NOT NULL CHECK (status IN ('DRAFT','PUBLISHED')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  version BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX recognition_honors_public_idx ON recognition_honors(status, year DESC, created_at DESC);
CREATE TABLE recognition_honor_participants (
  honor_id UUID NOT NULL REFERENCES recognition_honors(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  full_name VARCHAR(200) NOT NULL,
  award VARCHAR(100),
  PRIMARY KEY (honor_id, position)
);
CREATE TABLE recognition_achievements (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description VARCHAR(10000),
  category VARCHAR(30) NOT NULL CHECK (category IN ('OLYMPIC_NATIONAL','OLYMPIC_SCHOOL','RESEARCH_MINISTRY','RESEARCH_SCHOOL','RESEARCH_OTHER')),
  award VARCHAR(30) NOT NULL CHECK (award IN ('NONE','FIRST','SECOND','THIRD','CONSOLATION')),
  include_participation BOOLEAN NOT NULL,
  achieved_date DATE NOT NULL CHECK (achieved_date >= DATE '1900-01-01'),
  public_visible BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(30) NOT NULL CHECK (status IN ('PENDING','APPROVED','REJECTED','REVOKED')),
  award_points INTEGER NOT NULL CHECK (award_points >= 0),
  participation_points INTEGER NOT NULL CHECK (participation_points >= 0),
  submitted_by UUID NOT NULL REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  review_note VARCHAR(2000),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  version BIGINT NOT NULL DEFAULT 0,
  CHECK (award_points + participation_points > 0)
);
-- Concurrent duplicate submissions for the same student/event cannot receive a second credit.
CREATE UNIQUE INDEX recognition_achievement_active_claim_idx
  ON recognition_achievements(user_id, lower(title), category, achieved_date)
  WHERE status IN ('PENDING','APPROVED');
CREATE INDEX recognition_achievements_scores_idx ON recognition_achievements(user_id, achieved_date) WHERE status = 'APPROVED';
CREATE INDEX recognition_achievements_review_idx ON recognition_achievements(status, created_at DESC);
CREATE TABLE recognition_files (
  id UUID PRIMARY KEY,
  honor_id UUID REFERENCES recognition_honors(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES recognition_achievements(id) ON DELETE CASCADE,
  original_name VARCHAR(200) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL CHECK (size > 0 AND size <= 5242880),
  position INTEGER NOT NULL CHECK (position >= 0),
  content BYTEA NOT NULL,
  CHECK ((honor_id IS NULL) <> (achievement_id IS NULL)),
  CHECK (octet_length(content) = size),
  CHECK (content_type IN ('image/jpeg','image/png','image/webp','application/pdf'))
);
CREATE INDEX recognition_files_honor_idx ON recognition_files(honor_id, position);
CREATE INDEX recognition_files_achievement_idx ON recognition_files(achievement_id, position);
CREATE TABLE recognition_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  ranking_opt_in BOOLEAN NOT NULL DEFAULT FALSE
);

-- Private question figures
CREATE TABLE question_figures
(
    id             uuid PRIMARY KEY,
    question_id    uuid         NOT NULL,
    original_name  varchar(200) NOT NULL,
    content_type   varchar(100) NOT NULL,
    size           bigint       NOT NULL,
    content        bytea        NOT NULL,
    created_at     timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT fk_question_figure_question
        FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
    CONSTRAINT ck_question_figure_size CHECK (size > 0 AND size <= 5242880),
    CONSTRAINT ck_question_figure_octet_length CHECK (octet_length(content) = size),
    CONSTRAINT ck_question_figure_type
        CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp'))
);

CREATE INDEX idx_question_figure_question ON question_figures (question_id);

-- Frozen exams
CREATE TABLE exams
(
    id                       uuid PRIMARY KEY,
    subject_id               uuid          NOT NULL,
    created_by               uuid          NOT NULL,
    title                    varchar(300)  NOT NULL,
    instructions             varchar(4000) NOT NULL,
    release_at               timestamptz,
    latest_published_version integer,
    version                  bigint        NOT NULL DEFAULT 0,
    created_at               timestamptz   NOT NULL DEFAULT now(),
    updated_at               timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_exam_subject FOREIGN KEY (subject_id) REFERENCES subjects (id),
    CONSTRAINT fk_exam_creator FOREIGN KEY (created_by) REFERENCES users (id),
    CONSTRAINT ck_exam_title_length CHECK (char_length(title) <= 300),
    CONSTRAINT ck_exam_instructions_length CHECK (char_length(instructions) <= 4000),
    CONSTRAINT ck_exam_latest_version CHECK (latest_published_version IS NULL OR latest_published_version >= 1)
);

CREATE INDEX idx_exam_creator_updated ON exams (created_by, updated_at DESC);

CREATE TABLE exam_items
(
    id           uuid PRIMARY KEY,
    exam_id      uuid           NOT NULL,
    position     integer        NOT NULL,
    question_id  uuid           NOT NULL,
    points       numeric(8, 2)  NOT NULL,
    part_points  jsonb          NOT NULL,
    instructions varchar(4000)  NOT NULL,
    CONSTRAINT fk_exam_item_exam FOREIGN KEY (exam_id) REFERENCES exams (id) ON DELETE CASCADE,
    CONSTRAINT fk_exam_item_question FOREIGN KEY (question_id) REFERENCES questions (id),
    CONSTRAINT uk_exam_item_position UNIQUE (exam_id, position),
    CONSTRAINT ck_exam_item_position CHECK (position >= 0 AND position < 100),
    CONSTRAINT ck_exam_item_points CHECK (points > 0 AND points <= 1000),
    CONSTRAINT ck_exam_item_instructions_length CHECK (char_length(instructions) <= 4000),
    CONSTRAINT ck_exam_item_part_points_object CHECK (jsonb_typeof(part_points) = 'object')
);

CREATE INDEX idx_exam_item_question ON exam_items (question_id);

CREATE TABLE exam_papers
(
    id             uuid PRIMARY KEY,
    exam_id        uuid           NOT NULL,
    version_number integer        NOT NULL,
    title          varchar(300)   NOT NULL,
    subject_id     uuid           NOT NULL,
    instructions   varchar(4000)  NOT NULL,
    release_at     timestamptz    NOT NULL,
    published_at   timestamptz    NOT NULL,
    total_points   numeric(10, 2) NOT NULL,
    created_by     uuid           NOT NULL,
    CONSTRAINT fk_exam_paper_exam FOREIGN KEY (exam_id) REFERENCES exams (id),
    CONSTRAINT fk_exam_paper_subject FOREIGN KEY (subject_id) REFERENCES subjects (id),
    CONSTRAINT fk_exam_paper_creator FOREIGN KEY (created_by) REFERENCES users (id),
    CONSTRAINT uk_exam_paper_version UNIQUE (exam_id, version_number),
    CONSTRAINT ck_exam_paper_version CHECK (version_number >= 1),
    CONSTRAINT ck_exam_paper_title CHECK (char_length(btrim(title)) > 0 AND char_length(title) <= 300),
    CONSTRAINT ck_exam_paper_instructions_length CHECK (char_length(instructions) <= 4000),
    CONSTRAINT ck_exam_paper_points CHECK (total_points > 0 AND total_points <= 100000)
);

CREATE INDEX idx_exam_paper_release ON exam_papers (release_at DESC, version_number DESC);

CREATE TABLE exam_paper_items
(
    id               uuid PRIMARY KEY,
    paper_id         uuid           NOT NULL,
    position         integer        NOT NULL,
    question_id      uuid           NOT NULL,
    points           numeric(8, 2)  NOT NULL,
    part_points      jsonb          NOT NULL,
    instructions     varchar(4000)  NOT NULL,
    content_json     jsonb          NOT NULL,
    answer_json      jsonb          NOT NULL,
    explanation_json jsonb          NOT NULL,
    CONSTRAINT fk_exam_paper_item_paper FOREIGN KEY (paper_id) REFERENCES exam_papers (id) ON DELETE CASCADE,
    CONSTRAINT fk_exam_paper_item_question FOREIGN KEY (question_id) REFERENCES questions (id),
    CONSTRAINT uk_exam_paper_item_position UNIQUE (paper_id, position),
    CONSTRAINT ck_exam_paper_item_position CHECK (position >= 0 AND position < 100),
    CONSTRAINT ck_exam_paper_item_points CHECK (points > 0 AND points <= 1000),
    CONSTRAINT ck_exam_paper_item_instructions_length CHECK (char_length(instructions) <= 4000),
    CONSTRAINT ck_exam_paper_item_part_points_object CHECK (jsonb_typeof(part_points) = 'object'),
    CONSTRAINT ck_exam_paper_item_content_object CHECK (jsonb_typeof(content_json) = 'object'),
    CONSTRAINT ck_exam_paper_item_answer_object CHECK (jsonb_typeof(answer_json) = 'object'),
    CONSTRAINT ck_exam_paper_item_explanation_object CHECK (jsonb_typeof(explanation_json) = 'object')
);

CREATE INDEX idx_exam_paper_item_question ON exam_paper_items (question_id);

-- asset_id is the bank figure id frozen inside scientific JSON. Bytes are copied.
-- There is no foreign key to question_figures.
CREATE TABLE exam_paper_figures
(
    id            uuid PRIMARY KEY,
    paper_id      uuid         NOT NULL,
    asset_id      uuid         NOT NULL,
    question_id   uuid         NOT NULL,
    original_name varchar(200) NOT NULL,
    content_type  varchar(100) NOT NULL,
    size          bigint       NOT NULL,
    content       bytea        NOT NULL,
    solution_only boolean      NOT NULL,
    CONSTRAINT fk_exam_paper_figure_paper FOREIGN KEY (paper_id) REFERENCES exam_papers (id) ON DELETE CASCADE,
    CONSTRAINT fk_exam_paper_figure_question FOREIGN KEY (question_id) REFERENCES questions (id),
    CONSTRAINT uk_exam_paper_figure_asset UNIQUE (paper_id, asset_id),
    CONSTRAINT ck_exam_paper_figure_size CHECK (size > 0 AND size <= 5242880),
    CONSTRAINT ck_exam_paper_figure_octet_length CHECK (octet_length(content) = size),
    CONSTRAINT ck_exam_paper_figure_type CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp'))
);

CREATE INDEX idx_exam_paper_figure_paper ON exam_paper_figures (paper_id);

CREATE FUNCTION reject_frozen_exam_mutation() RETURNS trigger
    LANGUAGE plpgsql
AS
$$
BEGIN
    RAISE EXCEPTION 'published exam version is immutable';
END;
$$;

CREATE TRIGGER trg_exam_papers_no_update
    BEFORE UPDATE
    ON exam_papers
    FOR EACH ROW
EXECUTE FUNCTION reject_frozen_exam_mutation();

CREATE TRIGGER trg_exam_paper_items_no_update
    BEFORE UPDATE
    ON exam_paper_items
    FOR EACH ROW
EXECUTE FUNCTION reject_frozen_exam_mutation();

CREATE TRIGGER trg_exam_paper_figures_no_update
    BEFORE UPDATE
    ON exam_paper_figures
    FOR EACH ROW
EXECUTE FUNCTION reject_frozen_exam_mutation();

-- Accountability groups
-- Durable accountability groups. These rows are not study-room leases.
CREATE TABLE accountability_groups
(
    id         uuid PRIMARY KEY,
    owner_id   uuid         NOT NULL,
    name       varchar(120) NOT NULL,
    created_at timestamptz  NOT NULL DEFAULT now(),
    updated_at timestamptz  NOT NULL DEFAULT now(),
    avatar_id uuid,
    avatar_crop_x double precision,
    avatar_crop_y double precision,
    avatar_crop_zoom double precision,
    CONSTRAINT fk_accountability_group_owner FOREIGN KEY (owner_id) REFERENCES users (id),
    CONSTRAINT group_avatar_crop_valid CHECK (
        (avatar_id IS NULL AND avatar_crop_x IS NULL AND avatar_crop_y IS NULL AND avatar_crop_zoom IS NULL)
        OR (avatar_id IS NOT NULL AND avatar_crop_x BETWEEN 0 AND 1 AND avatar_crop_y BETWEEN 0 AND 1
            AND avatar_crop_zoom BETWEEN 1 AND 3 AND avatar_crop_x IS NOT NULL
            AND avatar_crop_y IS NOT NULL AND avatar_crop_zoom IS NOT NULL)
    )
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

-- Daily plans and reviews
CREATE TABLE daily_plans
(
    id                 uuid PRIMARY KEY,
    owner_id           uuid        NOT NULL REFERENCES users (id),
    plan_date          date        NOT NULL,
    first_submitted_at timestamptz,
    review_reasons     varchar(4000),
    review_went_well   varchar(4000),
    review_tomorrow    varchar(4000),
    created_at         timestamptz NOT NULL,
    updated_at         timestamptz NOT NULL,
    version            bigint      NOT NULL,
    CONSTRAINT uk_daily_plan_owner_date UNIQUE (owner_id, plan_date)
);

CREATE TABLE daily_tasks
(
    id       uuid PRIMARY KEY,
    plan_id  uuid         NOT NULL REFERENCES daily_plans (id) ON DELETE CASCADE,
    position integer      NOT NULL,
    title    varchar(200) NOT NULL,
    priority varchar(16)  NOT NULL,
    status   varchar(16)  NOT NULL,
    CONSTRAINT uk_daily_task_plan_position UNIQUE (plan_id, position) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT ck_daily_task_title CHECK (char_length(title) > 0),
    CONSTRAINT ck_daily_task_priority CHECK (priority IN ('MUST', 'SHOULD', 'COULD')),
    CONSTRAINT ck_daily_task_status CHECK (status IN ('TODO', 'COMPLETED'))
);

CREATE TABLE daily_weekly_reviews
(
    id                   uuid PRIMARY KEY,
    owner_id             uuid        NOT NULL REFERENCES users (id),
    week_start           date        NOT NULL,
    recurring_unfinished varchar(4000),
    issues               varchar(4000),
    reflection           varchar(4000),
    next_week_changes    varchar(4000),
    created_at           timestamptz NOT NULL,
    updated_at           timestamptz NOT NULL,
    version              bigint      NOT NULL,
    CONSTRAINT uk_daily_week_owner UNIQUE (owner_id, week_start)
);

-- Daily evidence
-- Evidence belongs to a saved task; its plan/owner are resolved through that task, not duplicated.
CREATE TABLE daily_evidence (
    id uuid PRIMARY KEY,
    task_id uuid NOT NULL REFERENCES daily_tasks(id) ON DELETE CASCADE,
    stage varchar(16) NOT NULL CHECK (stage IN ('START', 'FINISH', 'GENERAL')),
    kind varchar(16) NOT NULL CHECK (kind IN ('FILE', 'LINK')),
    original_name varchar(255),
    content_type varchar(255),
    size_bytes bigint,
    content bytea,
    url varchar(2048),
    label varchar(200),
    created_at timestamptz NOT NULL,
    CONSTRAINT ck_daily_evidence_payload CHECK (
        (kind = 'FILE' AND original_name IS NOT NULL AND char_length(original_name) > 0
            AND content_type IS NOT NULL AND char_length(content_type) > 0
            AND size_bytes IS NOT NULL AND size_bytes BETWEEN 1 AND 5242880
            AND content IS NOT NULL AND octet_length(content) = size_bytes
            AND url IS NULL AND label IS NULL)
        OR
        (kind = 'LINK' AND original_name IS NULL AND content_type IS NULL
            AND size_bytes IS NULL AND content IS NULL
            AND url IS NOT NULL AND char_length(url) > 0
            AND label IS NOT NULL AND char_length(btrim(label)) > 0)
    )
);
CREATE INDEX idx_daily_evidence_task ON daily_evidence(task_id);

-- Group invitations
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

-- Daily feedback
-- One plain-text contribution per author for one saved plan or saved weekly review inside one group.
CREATE TABLE daily_feedback
(
    id               uuid PRIMARY KEY,
    group_id         uuid          NOT NULL REFERENCES accountability_groups (id),
    owner_id         uuid          NOT NULL REFERENCES users (id),
    plan_id          uuid          REFERENCES daily_plans (id) ON DELETE CASCADE,
    weekly_review_id uuid          REFERENCES daily_weekly_reviews (id) ON DELETE CASCADE,
    author_id        uuid          NOT NULL REFERENCES users (id),
    text             varchar(4000) NOT NULL,
    created_at       timestamptz   NOT NULL,
    updated_at       timestamptz   NOT NULL,
    version          bigint        NOT NULL,
    CONSTRAINT ck_daily_feedback_one_review CHECK ((plan_id IS NOT NULL) <> (weekly_review_id IS NOT NULL)),
    CONSTRAINT ck_daily_feedback_text CHECK (char_length(text) > 0),
    CONSTRAINT ck_daily_feedback_author CHECK (author_id <> owner_id)
);

CREATE UNIQUE INDEX uk_daily_feedback_plan_author
    ON daily_feedback (group_id, plan_id, author_id)
    WHERE plan_id IS NOT NULL;

CREATE UNIQUE INDEX uk_daily_feedback_week_author
    ON daily_feedback (group_id, weekly_review_id, author_id)
    WHERE weekly_review_id IS NOT NULL;

-- Group avatars
-- Image bytes are loaded only by an authenticated member read.
CREATE TABLE group_avatars (
    group_id uuid PRIMARY KEY REFERENCES accountability_groups(id) ON DELETE CASCADE,
    avatar_id uuid NOT NULL,
    media_type varchar(20) NOT NULL CHECK (media_type IN ('image/jpeg', 'image/png', 'image/webp')),
    content bytea NOT NULL CHECK (octet_length(content) BETWEEN 1 AND 5242880)
);
