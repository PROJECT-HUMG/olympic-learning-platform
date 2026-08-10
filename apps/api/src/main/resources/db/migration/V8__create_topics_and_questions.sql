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
