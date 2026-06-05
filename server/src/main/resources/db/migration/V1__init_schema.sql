-- =====================================================================
-- V1: Olympic Learning Platform — Initial Schema
-- Author: nghlong3004
-- Date: 2026-06-05
-- =====================================================================

-- =====================================================================
-- Module: user
-- =====================================================================

CREATE TABLE roles (
    id          BIGSERIAL PRIMARY KEY,
    public_id   UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
    id          BIGSERIAL PRIMARY KEY,
    public_id   UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    name        VARCHAR(100) NOT NULL UNIQUE,
    module      VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE role_permissions (
    role_id       BIGINT NOT NULL REFERENCES roles(id),
    permission_id BIGINT NOT NULL REFERENCES permissions(id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    avatar_url      VARCHAR(500),
    student_code    VARCHAR(50) UNIQUE,
    role_id         BIGINT NOT NULL REFERENCES roles(id),
    enabled         BOOLEAN NOT NULL DEFAULT true,
    email_verified  BOOLEAN NOT NULL DEFAULT false,
    deleted         BOOLEAN NOT NULL DEFAULT false,
    deleted_at      TIMESTAMP,
    deleted_by      BIGINT REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),
    created_by      BIGINT REFERENCES users(id),
    updated_by      BIGINT REFERENCES users(id)
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted = false;
CREATE INDEX idx_users_role ON users(role_id) WHERE deleted = false;
CREATE INDEX idx_users_student_code ON users(student_code) WHERE deleted = false AND student_code IS NOT NULL;

-- =====================================================================
-- Module: auth
-- =====================================================================

CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    token       VARCHAR(500) NOT NULL UNIQUE,
    user_id     BIGINT NOT NULL REFERENCES users(id),
    expires_at  TIMESTAMP NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

CREATE TABLE password_reset_tokens (
    id          BIGSERIAL PRIMARY KEY,
    token       VARCHAR(500) NOT NULL UNIQUE,
    user_id     BIGINT NOT NULL REFERENCES users(id),
    expires_at  TIMESTAMP NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

-- =====================================================================
-- Module: learning
-- =====================================================================

CREATE TABLE subjects (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    name            VARCHAR(255) NOT NULL UNIQUE,
    code            VARCHAR(50) NOT NULL UNIQUE,
    description     TEXT,
    icon_url        VARCHAR(500),
    display_order   INT NOT NULL DEFAULT 0,
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),
    created_by      BIGINT REFERENCES users(id),
    updated_by      BIGINT REFERENCES users(id)
);

CREATE TABLE topics (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    subject_id      BIGINT NOT NULL REFERENCES subjects(id),
    parent_id       BIGINT REFERENCES topics(id),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    display_order   INT NOT NULL DEFAULT 0,
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),
    created_by      BIGINT REFERENCES users(id),
    updated_by      BIGINT REFERENCES users(id)
);

CREATE INDEX idx_topics_subject ON topics(subject_id);
CREATE INDEX idx_topics_parent ON topics(parent_id);
CREATE UNIQUE INDEX idx_topics_name_subject ON topics(name, subject_id);

CREATE TABLE learning_objectives (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    topic_id        BIGINT NOT NULL REFERENCES topics(id),
    code            VARCHAR(50) NOT NULL,
    description     TEXT NOT NULL,
    bloom_level     VARCHAR(30),
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),
    created_by      BIGINT REFERENCES users(id),
    updated_by      BIGINT REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_lo_code ON learning_objectives(code);
CREATE INDEX idx_lo_topic ON learning_objectives(topic_id);

CREATE TABLE learning_roadmaps (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    subject_id      BIGINT NOT NULL REFERENCES subjects(id),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    difficulty      VARCHAR(30) NOT NULL DEFAULT 'INTERMEDIATE',
    estimated_weeks INT,
    published       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),
    created_by      BIGINT REFERENCES users(id),
    updated_by      BIGINT REFERENCES users(id)
);

CREATE INDEX idx_roadmaps_subject ON learning_roadmaps(subject_id);

-- =====================================================================
-- Module: content
-- =====================================================================

CREATE TABLE news (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    title           VARCHAR(500) NOT NULL,
    slug            VARCHAR(500) NOT NULL UNIQUE,
    summary         TEXT,
    content         TEXT NOT NULL,
    cover_image_url VARCHAR(500),
    published       BOOLEAN NOT NULL DEFAULT false,
    published_at    TIMESTAMP,
    deleted         BOOLEAN NOT NULL DEFAULT false,
    deleted_at      TIMESTAMP,
    deleted_by      BIGINT REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),
    created_by      BIGINT REFERENCES users(id),
    updated_by      BIGINT REFERENCES users(id)
);

CREATE INDEX idx_news_published ON news(published, published_at DESC) WHERE deleted = false;
CREATE INDEX idx_news_slug ON news(slug) WHERE deleted = false;

CREATE TABLE announcements (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    title           VARCHAR(500) NOT NULL,
    content         TEXT NOT NULL,
    priority        VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    target_role     VARCHAR(50),
    published       BOOLEAN NOT NULL DEFAULT false,
    published_at    TIMESTAMP,
    expires_at      TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),
    created_by      BIGINT REFERENCES users(id),
    updated_by      BIGINT REFERENCES users(id)
);

CREATE TABLE learning_resources (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    resource_type   VARCHAR(50) NOT NULL,
    file_url        VARCHAR(500),
    external_url    VARCHAR(500),
    subject_id      BIGINT REFERENCES subjects(id),
    topic_id        BIGINT REFERENCES topics(id),
    deleted         BOOLEAN NOT NULL DEFAULT false,
    deleted_at      TIMESTAMP,
    deleted_by      BIGINT REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),
    created_by      BIGINT REFERENCES users(id),
    updated_by      BIGINT REFERENCES users(id)
);

CREATE INDEX idx_learning_resources_subject ON learning_resources(subject_id) WHERE deleted = false;
CREATE INDEX idx_learning_resources_topic ON learning_resources(topic_id) WHERE deleted = false;

CREATE TABLE roadmap_steps (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    roadmap_id      BIGINT NOT NULL REFERENCES learning_roadmaps(id) ON DELETE CASCADE,
    step_order      INT NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    topic_id        BIGINT REFERENCES topics(id),
    resource_id     BIGINT REFERENCES learning_resources(id),
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_roadmap_steps_roadmap ON roadmap_steps(roadmap_id);

-- =====================================================================
-- Module: questionbank
-- =====================================================================

CREATE TABLE questions (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    subject_id      BIGINT NOT NULL REFERENCES subjects(id),
    topic_id        BIGINT REFERENCES topics(id),
    question_type   VARCHAR(30) NOT NULL,
    difficulty      VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    content         TEXT NOT NULL,
    explanation     TEXT,
    points          DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    status          VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    version         INT NOT NULL DEFAULT 1,
    source          VARCHAR(255),
    tags            TEXT[],
    deleted         BOOLEAN NOT NULL DEFAULT false,
    deleted_at      TIMESTAMP,
    deleted_by      BIGINT REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),
    created_by      BIGINT REFERENCES users(id),
    updated_by      BIGINT REFERENCES users(id)
);

CREATE INDEX idx_questions_subject ON questions(subject_id) WHERE deleted = false;
CREATE INDEX idx_questions_topic ON questions(topic_id) WHERE deleted = false;
CREATE INDEX idx_questions_status ON questions(status) WHERE deleted = false;
CREATE INDEX idx_questions_type ON questions(question_type) WHERE deleted = false;
CREATE INDEX idx_questions_difficulty ON questions(difficulty) WHERE deleted = false;
CREATE INDEX idx_questions_tags ON questions USING GIN(tags) WHERE deleted = false;

CREATE TABLE question_options (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    question_id     BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    label           VARCHAR(10) NOT NULL,
    content         TEXT NOT NULL,
    is_correct      BOOLEAN NOT NULL DEFAULT false,
    display_order   INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_options_question ON question_options(question_id);

CREATE TABLE answer_rules (
    id                BIGSERIAL PRIMARY KEY,
    public_id         UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    question_id       BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    grading_strategy  VARCHAR(30) NOT NULL,
    correct_answer    TEXT,
    tolerance         DECIMAL(10,4),
    case_sensitive    BOOLEAN DEFAULT false,
    config_json       JSONB,
    created_at        TIMESTAMP NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_answer_rules_question ON answer_rules(question_id);

CREATE TABLE question_versions (
    id                    BIGSERIAL PRIMARY KEY,
    public_id             UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    question_id           BIGINT NOT NULL REFERENCES questions(id),
    version_number        INT NOT NULL,
    content               TEXT NOT NULL,
    explanation           TEXT,
    points                DECIMAL(5,2) NOT NULL,
    question_type         VARCHAR(30) NOT NULL,
    difficulty            VARCHAR(20) NOT NULL,
    options_snapshot       JSONB,
    answer_rules_snapshot  JSONB,
    created_at            TIMESTAMP NOT NULL DEFAULT now(),
    created_by            BIGINT REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_qv_question_version ON question_versions(question_id, version_number);

CREATE TABLE question_objectives (
    question_id     BIGINT NOT NULL REFERENCES questions(id),
    objective_id    BIGINT NOT NULL REFERENCES learning_objectives(id),
    PRIMARY KEY (question_id, objective_id)
);

CREATE TABLE question_reviews (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    question_id     BIGINT NOT NULL REFERENCES questions(id),
    reviewer_id     BIGINT NOT NULL REFERENCES users(id),
    action          VARCHAR(30) NOT NULL,
    comment         TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_question ON question_reviews(question_id);

-- =====================================================================
-- Module: campaign (must be before assessment due to FK)
-- =====================================================================

CREATE TABLE campaigns (
    id                  BIGSERIAL PRIMARY KEY,
    public_id           UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    subject_id          BIGINT NOT NULL REFERENCES subjects(id),
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    academic_year       VARCHAR(20) NOT NULL,
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    enrollment_deadline DATE,
    status              VARCHAR(30) NOT NULL DEFAULT 'PLANNING',
    deleted             BOOLEAN NOT NULL DEFAULT false,
    deleted_at          TIMESTAMP,
    deleted_by          BIGINT REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP NOT NULL DEFAULT now(),
    created_by          BIGINT REFERENCES users(id),
    updated_by          BIGINT REFERENCES users(id)
);

CREATE INDEX idx_campaigns_subject ON campaigns(subject_id) WHERE deleted = false;
CREATE INDEX idx_campaigns_status ON campaigns(status) WHERE deleted = false;
CREATE INDEX idx_campaigns_year ON campaigns(academic_year) WHERE deleted = false;

CREATE TABLE campaign_enrollments (
    id                  BIGSERIAL PRIMARY KEY,
    public_id           UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    campaign_id         BIGINT NOT NULL REFERENCES campaigns(id),
    student_id          BIGINT NOT NULL REFERENCES users(id),
    enrollment_status   VARCHAR(30) NOT NULL DEFAULT 'ENROLLED',
    enrolled_at         TIMESTAMP NOT NULL DEFAULT now(),
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_enrollments_unique ON campaign_enrollments(campaign_id, student_id);
CREATE INDEX idx_enrollments_campaign ON campaign_enrollments(campaign_id);

CREATE TABLE selection_score_rules (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    campaign_id     BIGINT NOT NULL REFERENCES campaigns(id),
    assessment_type VARCHAR(30) NOT NULL,
    weight_percent  DECIMAL(5,2) NOT NULL,
    aggregation     VARCHAR(30) NOT NULL DEFAULT 'AVERAGE',
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_score_rules_campaign ON selection_score_rules(campaign_id);

-- =====================================================================
-- Module: assessment
-- =====================================================================

CREATE TABLE assessments (
    id                BIGSERIAL PRIMARY KEY,
    public_id         UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    title             VARCHAR(500) NOT NULL,
    description       TEXT,
    assessment_type   VARCHAR(30) NOT NULL,
    subject_id        BIGINT NOT NULL REFERENCES subjects(id),
    duration_minutes  INT,
    start_time        TIMESTAMP,
    end_time          TIMESTAMP,
    max_attempts      INT DEFAULT 1,
    shuffle_questions BOOLEAN DEFAULT false,
    shuffle_options   BOOLEAN DEFAULT false,
    show_answers      BOOLEAN DEFAULT true,
    passing_score     DECIMAL(5,2),
    total_points      DECIMAL(7,2),
    status            VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    published_at      TIMESTAMP,
    campaign_id       BIGINT REFERENCES campaigns(id),
    deleted           BOOLEAN NOT NULL DEFAULT false,
    deleted_at        TIMESTAMP,
    deleted_by        BIGINT REFERENCES users(id),
    created_at        TIMESTAMP NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP NOT NULL DEFAULT now(),
    created_by        BIGINT REFERENCES users(id),
    updated_by        BIGINT REFERENCES users(id)
);

CREATE INDEX idx_assessments_type ON assessments(assessment_type) WHERE deleted = false;
CREATE INDEX idx_assessments_subject ON assessments(subject_id) WHERE deleted = false;
CREATE INDEX idx_assessments_status ON assessments(status) WHERE deleted = false;
CREATE INDEX idx_assessments_campaign ON assessments(campaign_id) WHERE deleted = false AND campaign_id IS NOT NULL;

CREATE TABLE assessment_questions (
    id                    BIGSERIAL PRIMARY KEY,
    public_id             UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    assessment_id         BIGINT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_id           BIGINT NOT NULL REFERENCES questions(id),
    question_version_id   BIGINT NOT NULL REFERENCES question_versions(id),
    question_order        INT NOT NULL,
    points_override       DECIMAL(5,2),
    created_at            TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_aq_assessment ON assessment_questions(assessment_id);
CREATE UNIQUE INDEX idx_aq_assessment_order ON assessment_questions(assessment_id, question_order);

CREATE TABLE assessment_attempts (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    assessment_id   BIGINT NOT NULL REFERENCES assessments(id),
    student_id      BIGINT NOT NULL REFERENCES users(id),
    attempt_number  INT NOT NULL DEFAULT 1,
    started_at      TIMESTAMP NOT NULL DEFAULT now(),
    submitted_at    TIMESTAMP,
    status          VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    total_score     DECIMAL(7,2),
    max_score       DECIMAL(7,2),
    percentage      DECIMAL(5,2),
    passed          BOOLEAN,
    ip_address      VARCHAR(45),
    deleted         BOOLEAN NOT NULL DEFAULT false,
    deleted_at      TIMESTAMP,
    deleted_by      BIGINT REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_attempts_assessment ON assessment_attempts(assessment_id) WHERE deleted = false;
CREATE INDEX idx_attempts_student ON assessment_attempts(student_id) WHERE deleted = false;
CREATE UNIQUE INDEX idx_attempts_unique ON assessment_attempts(assessment_id, student_id, attempt_number) WHERE deleted = false;

CREATE TABLE attempt_answers (
    id                      BIGSERIAL PRIMARY KEY,
    public_id               UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    attempt_id              BIGINT NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    assessment_question_id  BIGINT NOT NULL REFERENCES assessment_questions(id),
    selected_option_ids     BIGINT[],
    text_answer             TEXT,
    numeric_answer          DECIMAL(20,6),
    is_correct              BOOLEAN,
    score                   DECIMAL(5,2),
    graded_at               TIMESTAMP,
    graded_by               BIGINT REFERENCES users(id),
    feedback                TEXT,
    created_at              TIMESTAMP NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_answers_attempt ON attempt_answers(attempt_id);
CREATE UNIQUE INDEX idx_answers_unique ON attempt_answers(attempt_id, assessment_question_id);

-- =====================================================================
-- Module: campaign (continued — tables that depend on assessments)
-- =====================================================================

CREATE TABLE campaign_schedule (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    campaign_id     BIGINT NOT NULL REFERENCES campaigns(id),
    week_number     INT NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    assessment_id   BIGINT REFERENCES assessments(id),
    scheduled_date  DATE,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_schedule_campaign ON campaign_schedule(campaign_id);
CREATE UNIQUE INDEX idx_schedule_week ON campaign_schedule(campaign_id, week_number);

CREATE TABLE official_team_members (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    campaign_id     BIGINT NOT NULL REFERENCES campaigns(id),
    student_id      BIGINT NOT NULL REFERENCES users(id),
    final_score     DECIMAL(7,2) NOT NULL,
    rank            INT NOT NULL,
    selected_at     TIMESTAMP NOT NULL DEFAULT now(),
    notes           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),
    created_by      BIGINT REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_team_unique ON official_team_members(campaign_id, student_id);
CREATE INDEX idx_team_campaign ON official_team_members(campaign_id);

-- =====================================================================
-- Module: achievement
-- =====================================================================

CREATE TABLE achievements (
    id                  BIGSERIAL PRIMARY KEY,
    public_id           UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    student_id          BIGINT NOT NULL REFERENCES users(id),
    campaign_id         BIGINT REFERENCES campaigns(id),
    title               VARCHAR(500) NOT NULL,
    achievement_type    VARCHAR(50) NOT NULL,
    competition_name    VARCHAR(500),
    competition_level   VARCHAR(50),
    year                INT NOT NULL,
    description         TEXT,
    certificate_url     VARCHAR(500),
    verified            BOOLEAN NOT NULL DEFAULT false,
    deleted             BOOLEAN NOT NULL DEFAULT false,
    deleted_at          TIMESTAMP,
    deleted_by          BIGINT REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP NOT NULL DEFAULT now(),
    created_by          BIGINT REFERENCES users(id),
    updated_by          BIGINT REFERENCES users(id)
);

CREATE INDEX idx_achievements_student ON achievements(student_id) WHERE deleted = false;
CREATE INDEX idx_achievements_year ON achievements(year) WHERE deleted = false;
CREATE INDEX idx_achievements_type ON achievements(achievement_type) WHERE deleted = false;

-- =====================================================================
-- Module: leaderboard
-- =====================================================================

CREATE TABLE leaderboard_entries (
    id                    BIGSERIAL PRIMARY KEY,
    public_id             UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    student_id            BIGINT NOT NULL REFERENCES users(id),
    campaign_id           BIGINT REFERENCES campaigns(id),
    subject_id            BIGINT REFERENCES subjects(id),
    total_score           DECIMAL(10,2) NOT NULL DEFAULT 0,
    assessments_completed INT NOT NULL DEFAULT 0,
    average_score         DECIMAL(5,2) NOT NULL DEFAULT 0,
    rank                  INT,
    calculated_at         TIMESTAMP NOT NULL DEFAULT now(),
    created_at            TIMESTAMP NOT NULL DEFAULT now(),
    updated_at            TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_leaderboard_unique ON leaderboard_entries(student_id, campaign_id, subject_id)
    WHERE campaign_id IS NOT NULL AND subject_id IS NOT NULL;
CREATE INDEX idx_leaderboard_rank ON leaderboard_entries(campaign_id, subject_id, rank);

-- =====================================================================
-- Module: analytics
-- =====================================================================

CREATE TABLE student_topic_progress (
    id                  BIGSERIAL PRIMARY KEY,
    student_id          BIGINT NOT NULL REFERENCES users(id),
    topic_id            BIGINT NOT NULL REFERENCES topics(id),
    questions_attempted INT NOT NULL DEFAULT 0,
    questions_correct   INT NOT NULL DEFAULT 0,
    accuracy_percent    DECIMAL(5,2) NOT NULL DEFAULT 0,
    last_practiced_at   TIMESTAMP,
    mastery_level       VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_progress_unique ON student_topic_progress(student_id, topic_id);
CREATE INDEX idx_progress_student ON student_topic_progress(student_id);

CREATE TABLE assessment_result_summaries (
    id                  BIGSERIAL PRIMARY KEY,
    assessment_id       BIGINT NOT NULL REFERENCES assessments(id),
    total_participants  INT NOT NULL DEFAULT 0,
    average_score       DECIMAL(5,2),
    highest_score       DECIMAL(7,2),
    lowest_score        DECIMAL(7,2),
    pass_rate           DECIMAL(5,2),
    calculated_at       TIMESTAMP NOT NULL DEFAULT now(),
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_result_summary_assessment ON assessment_result_summaries(assessment_id);

-- =====================================================================
-- Module: notification
-- =====================================================================

CREATE TABLE email_notifications (
    id                  BIGSERIAL PRIMARY KEY,
    public_id           UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    recipient_id        BIGINT NOT NULL REFERENCES users(id),
    email_to            VARCHAR(255) NOT NULL,
    subject             VARCHAR(500) NOT NULL,
    body                TEXT NOT NULL,
    notification_type   VARCHAR(50) NOT NULL,
    reference_type      VARCHAR(50),
    reference_id        BIGINT,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    sent_at             TIMESTAMP,
    error_message       TEXT,
    retry_count         INT NOT NULL DEFAULT 0,
    created_at          TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON email_notifications(recipient_id);
CREATE INDEX idx_notifications_status ON email_notifications(status);

-- =====================================================================
-- Module: storage
-- =====================================================================

CREATE TABLE file_metadata (
    id                      BIGSERIAL PRIMARY KEY,
    public_id               UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    cloudinary_public_id    VARCHAR(500) NOT NULL,
    original_name           VARCHAR(500) NOT NULL,
    file_url                VARCHAR(1000) NOT NULL,
    secure_url              VARCHAR(1000),
    file_type               VARCHAR(50) NOT NULL,
    mime_type               VARCHAR(100),
    file_size               BIGINT,
    width                   INT,
    height                  INT,
    uploaded_by             BIGINT NOT NULL REFERENCES users(id),
    module                  VARCHAR(50),
    entity_type             VARCHAR(50),
    entity_id               BIGINT,
    created_at              TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_files_uploaded_by ON file_metadata(uploaded_by);
CREATE INDEX idx_files_entity ON file_metadata(module, entity_type, entity_id);
CREATE INDEX idx_files_cloudinary ON file_metadata(cloudinary_public_id);

-- =====================================================================
-- Seed data: Default roles
-- =====================================================================

INSERT INTO roles (name, description) VALUES
    ('ADMIN', 'Quản trị hệ thống'),
    ('LECTURER', 'Giảng viên'),
    ('QUESTION_REVIEWER', 'Người duyệt câu hỏi'),
    ('CONTENT_CONTRIBUTOR', 'Người đóng góp nội dung'),
    ('STUDENT', 'Sinh viên');
