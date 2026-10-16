-- Existing review timestamps are overwritten by revocation/resubmission. Do not
-- backfill an invented attainment time for existing approved totals.
CREATE TABLE recognition_score_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES recognition_achievements(id) ON DELETE CASCADE,
    achieved_year INTEGER NOT NULL CHECK (achieved_year >= 1900),
    points_delta INTEGER NOT NULL CHECK (points_delta <> 0),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX recognition_score_events_user_idx ON recognition_score_events(user_id, id DESC);
CREATE INDEX recognition_score_events_year_idx ON recognition_score_events(user_id, achieved_year, id DESC);
