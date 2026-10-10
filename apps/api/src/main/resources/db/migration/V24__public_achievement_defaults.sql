-- Product decision 2026-10-10: existing achievements become visibility-eligible.
-- Approved records for active users become public; approval, evidence access and ranking consent
-- are unchanged. Pending/rejected/revoked records remain excluded by public read eligibility.
ALTER TABLE recognition_achievements ALTER COLUMN public_visible SET DEFAULT TRUE;
UPDATE recognition_achievements
SET public_visible = TRUE, version = version + 1, updated_at = CURRENT_TIMESTAMP
WHERE public_visible = FALSE;
-- Owners retain their future visibility controls. This one-time migration is not a trigger.
