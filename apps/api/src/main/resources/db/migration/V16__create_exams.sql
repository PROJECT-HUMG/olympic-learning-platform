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
