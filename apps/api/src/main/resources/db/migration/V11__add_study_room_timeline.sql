ALTER TABLE study_rooms ADD COLUMN timeline_started_at timestamptz;
UPDATE study_rooms SET timeline_started_at = created_at;
ALTER TABLE study_rooms ALTER COLUMN timeline_started_at SET NOT NULL;
ALTER TABLE study_rooms ALTER COLUMN timeline_started_at SET DEFAULT now();
ALTER TABLE study_rooms ADD COLUMN rhythm_version bigint NOT NULL DEFAULT 0;
ALTER TABLE study_rooms ADD CONSTRAINT ck_study_room_rhythm_version CHECK (rhythm_version >= 0);
