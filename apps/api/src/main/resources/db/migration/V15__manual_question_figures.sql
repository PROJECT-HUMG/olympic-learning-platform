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
