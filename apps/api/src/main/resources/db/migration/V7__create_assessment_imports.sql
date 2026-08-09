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
