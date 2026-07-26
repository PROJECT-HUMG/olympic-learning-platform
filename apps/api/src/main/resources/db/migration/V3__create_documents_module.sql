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