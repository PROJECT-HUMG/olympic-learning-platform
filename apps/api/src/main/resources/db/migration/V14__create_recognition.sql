-- Honorary memories are deliberately independent of academic achievements and scoring.
CREATE TABLE recognition_honors (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 1900 AND 2100),
  description VARCHAR(10000),
  scope VARCHAR(30) NOT NULL CHECK (scope IN ('SCHOOL','NATIONAL','INTERNATIONAL','OTHER')),
  status VARCHAR(30) NOT NULL CHECK (status IN ('DRAFT','PUBLISHED')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  version BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX recognition_honors_public_idx ON recognition_honors(status, year DESC, created_at DESC);
CREATE TABLE recognition_honor_participants (
  honor_id UUID NOT NULL REFERENCES recognition_honors(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  full_name VARCHAR(200) NOT NULL,
  award VARCHAR(100),
  PRIMARY KEY (honor_id, position)
);
CREATE TABLE recognition_achievements (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description VARCHAR(10000),
  category VARCHAR(30) NOT NULL CHECK (category IN ('OLYMPIC_NATIONAL','OLYMPIC_SCHOOL','RESEARCH_MINISTRY','RESEARCH_SCHOOL','RESEARCH_OTHER')),
  award VARCHAR(30) NOT NULL CHECK (award IN ('NONE','FIRST','SECOND','THIRD','CONSOLATION')),
  include_participation BOOLEAN NOT NULL,
  achieved_date DATE NOT NULL CHECK (achieved_date >= DATE '1900-01-01'),
  public_visible BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(30) NOT NULL CHECK (status IN ('PENDING','APPROVED','REJECTED','REVOKED')),
  award_points INTEGER NOT NULL CHECK (award_points >= 0),
  participation_points INTEGER NOT NULL CHECK (participation_points >= 0),
  submitted_by UUID NOT NULL REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  review_note VARCHAR(2000),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  version BIGINT NOT NULL DEFAULT 0,
  CHECK (award_points + participation_points > 0)
);
-- Concurrent duplicate submissions for the same student/event cannot receive a second credit.
CREATE UNIQUE INDEX recognition_achievement_active_claim_idx
  ON recognition_achievements(user_id, lower(title), category, achieved_date)
  WHERE status IN ('PENDING','APPROVED');
CREATE INDEX recognition_achievements_scores_idx ON recognition_achievements(user_id, achieved_date) WHERE status = 'APPROVED';
CREATE INDEX recognition_achievements_review_idx ON recognition_achievements(status, created_at DESC);
CREATE TABLE recognition_files (
  id UUID PRIMARY KEY,
  honor_id UUID REFERENCES recognition_honors(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES recognition_achievements(id) ON DELETE CASCADE,
  original_name VARCHAR(200) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL CHECK (size > 0 AND size <= 5242880),
  position INTEGER NOT NULL CHECK (position >= 0),
  content BYTEA NOT NULL,
  CHECK ((honor_id IS NULL) <> (achievement_id IS NULL)),
  CHECK (octet_length(content) = size),
  CHECK (content_type IN ('image/jpeg','image/png','image/webp','application/pdf'))
);
CREATE INDEX recognition_files_honor_idx ON recognition_files(honor_id, position);
CREATE INDEX recognition_files_achievement_idx ON recognition_files(achievement_id, position);
CREATE TABLE recognition_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  ranking_opt_in BOOLEAN NOT NULL DEFAULT FALSE
);
