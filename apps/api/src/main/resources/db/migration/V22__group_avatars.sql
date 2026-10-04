-- Metadata stays cheap to list; image bytes are loaded only by an authenticated member read.
ALTER TABLE accountability_groups
    ADD COLUMN avatar_id uuid,
    ADD COLUMN avatar_crop_x double precision,
    ADD COLUMN avatar_crop_y double precision,
    ADD COLUMN avatar_crop_zoom double precision,
    ADD CONSTRAINT group_avatar_crop_valid CHECK (
      (avatar_id IS NULL AND avatar_crop_x IS NULL AND avatar_crop_y IS NULL AND avatar_crop_zoom IS NULL)
      OR (avatar_id IS NOT NULL AND avatar_crop_x BETWEEN 0 AND 1 AND avatar_crop_y BETWEEN 0 AND 1
          AND avatar_crop_zoom BETWEEN 1 AND 3 AND avatar_crop_x IS NOT NULL
          AND avatar_crop_y IS NOT NULL AND avatar_crop_zoom IS NOT NULL));

CREATE TABLE group_avatars (
    group_id uuid PRIMARY KEY REFERENCES accountability_groups(id) ON DELETE CASCADE,
    avatar_id uuid NOT NULL,
    media_type varchar(20) NOT NULL CHECK (media_type IN ('image/jpeg', 'image/png', 'image/webp')),
    content bytea NOT NULL CHECK (octet_length(content) BETWEEN 1 AND 5242880)
);
