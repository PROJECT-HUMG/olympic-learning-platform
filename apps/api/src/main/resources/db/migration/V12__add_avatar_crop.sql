ALTER TABLE users
    ADD COLUMN avatar_crop_x double precision,
    ADD COLUMN avatar_crop_y double precision,
    ADD COLUMN avatar_crop_zoom double precision,
    ADD CONSTRAINT users_avatar_crop_valid CHECK (
        (avatar_crop_x IS NULL AND avatar_crop_y IS NULL AND avatar_crop_zoom IS NULL)
        OR (
            avatar_crop_x IS NOT NULL AND avatar_crop_y IS NOT NULL AND avatar_crop_zoom IS NOT NULL
            AND avatar_crop_x BETWEEN 0 AND 1
            AND avatar_crop_y BETWEEN 0 AND 1
            AND avatar_crop_zoom BETWEEN 1 AND 3
        )
    );
