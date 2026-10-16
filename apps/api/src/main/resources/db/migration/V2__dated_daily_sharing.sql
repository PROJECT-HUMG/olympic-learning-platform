-- Explicit per-entry grants. Existing ongoing group preferences grant no entry access.
-- No automatic backfill: a saved entry starts private until its owner shares it.
CREATE TABLE daily_entry_viewers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
    group_id uuid NOT NULL REFERENCES accountability_groups(id) ON DELETE CASCADE,
    viewer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_at timestamptz NOT NULL,
    UNIQUE (plan_id, group_id, viewer_id)
);
CREATE INDEX idx_daily_entry_viewer_group ON daily_entry_viewers(group_id, viewer_id, shared_at DESC);
