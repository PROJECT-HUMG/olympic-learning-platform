-- V22 already owns group avatars. Preserve all legacy evidence records and bytes.
-- New file uploads have no before/after distinction.
ALTER TABLE daily_evidence DROP CONSTRAINT daily_evidence_stage_check;
ALTER TABLE daily_evidence ADD CONSTRAINT daily_evidence_stage_check
    CHECK (stage IN ('START', 'FINISH', 'GENERAL'));
