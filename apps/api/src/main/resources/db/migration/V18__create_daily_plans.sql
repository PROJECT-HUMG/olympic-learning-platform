CREATE TABLE daily_plans
(
    id                 uuid PRIMARY KEY,
    owner_id           uuid        NOT NULL REFERENCES users (id),
    plan_date          date        NOT NULL,
    first_submitted_at timestamptz,
    review_reasons     varchar(4000),
    review_went_well   varchar(4000),
    review_tomorrow    varchar(4000),
    created_at         timestamptz NOT NULL,
    updated_at         timestamptz NOT NULL,
    version            bigint      NOT NULL,
    CONSTRAINT uk_daily_plan_owner_date UNIQUE (owner_id, plan_date)
);

CREATE TABLE daily_tasks
(
    id       uuid PRIMARY KEY,
    plan_id  uuid         NOT NULL REFERENCES daily_plans (id) ON DELETE CASCADE,
    position integer      NOT NULL,
    title    varchar(200) NOT NULL,
    priority varchar(16)  NOT NULL,
    status   varchar(16)  NOT NULL,
    CONSTRAINT uk_daily_task_plan_position UNIQUE (plan_id, position) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT ck_daily_task_title CHECK (char_length(title) > 0),
    CONSTRAINT ck_daily_task_priority CHECK (priority IN ('MUST', 'SHOULD', 'COULD')),
    CONSTRAINT ck_daily_task_status CHECK (status IN ('TODO', 'COMPLETED'))
);

CREATE TABLE daily_weekly_reviews
(
    id                   uuid PRIMARY KEY,
    owner_id             uuid        NOT NULL REFERENCES users (id),
    week_start           date        NOT NULL,
    recurring_unfinished varchar(4000),
    issues               varchar(4000),
    reflection           varchar(4000),
    next_week_changes    varchar(4000),
    created_at           timestamptz NOT NULL,
    updated_at           timestamptz NOT NULL,
    version              bigint      NOT NULL,
    CONSTRAINT uk_daily_week_owner UNIQUE (owner_id, week_start)
);
