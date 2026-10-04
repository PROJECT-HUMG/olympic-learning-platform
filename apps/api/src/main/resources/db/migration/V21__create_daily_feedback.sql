-- One plain-text contribution per author for one saved plan or saved weekly review inside one group.
CREATE TABLE daily_feedback
(
    id               uuid PRIMARY KEY,
    group_id         uuid          NOT NULL REFERENCES accountability_groups (id),
    owner_id         uuid          NOT NULL REFERENCES users (id),
    plan_id          uuid          REFERENCES daily_plans (id) ON DELETE CASCADE,
    weekly_review_id uuid          REFERENCES daily_weekly_reviews (id) ON DELETE CASCADE,
    author_id        uuid          NOT NULL REFERENCES users (id),
    text             varchar(4000) NOT NULL,
    created_at       timestamptz   NOT NULL,
    updated_at       timestamptz   NOT NULL,
    version          bigint        NOT NULL,
    CONSTRAINT ck_daily_feedback_one_review CHECK ((plan_id IS NOT NULL) <> (weekly_review_id IS NOT NULL)),
    CONSTRAINT ck_daily_feedback_text CHECK (char_length(text) > 0),
    CONSTRAINT ck_daily_feedback_author CHECK (author_id <> owner_id)
);

CREATE UNIQUE INDEX uk_daily_feedback_plan_author
    ON daily_feedback (group_id, plan_id, author_id)
    WHERE plan_id IS NOT NULL;

CREATE UNIQUE INDEX uk_daily_feedback_week_author
    ON daily_feedback (group_id, weekly_review_id, author_id)
    WHERE weekly_review_id IS NOT NULL;
