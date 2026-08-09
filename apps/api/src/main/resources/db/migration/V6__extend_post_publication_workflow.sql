ALTER TYPE post_type ADD VALUE IF NOT EXISTS 'BLOG';
ALTER TYPE post_status ADD VALUE IF NOT EXISTS 'ARCHIVED';

ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_posts_public_active
    ON posts (status, published_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_pinned_active
    ON posts (is_pinned, published_at DESC)
    WHERE deleted_at IS NULL AND is_pinned = true;
