CREATE TYPE post_type AS ENUM (
    'NEWS',
    'ANNOUNCEMENT'
);

CREATE TYPE post_status AS ENUM (
    'DRAFT',
    'PUBLISHED'
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