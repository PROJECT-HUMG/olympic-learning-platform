CREATE TYPE user_role AS ENUM ('STUDENT', 'LECTURER', 'ADMIN');
CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'DISABLED');

CREATE TABLE users
(
    id            uuid PRIMARY KEY      DEFAULT gen_random_uuid(),
    email         varchar(100) NOT NULL,
    username      varchar(100) NOT NULL,
    role          user_role    NOT NULL DEFAULT 'STUDENT',
    status        user_status  NOT NULL DEFAULT 'PENDING',
    full_name     varchar(255),
    password_hash varchar(255),
    avatar_url    varchar(512),
    last_login_at timestamptz,
    deleted_at    timestamptz,
    updated_at    timestamptz  NOT NULL DEFAULT now(),
    created_at    timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT uk_users_username UNIQUE (username)
);

CREATE UNIQUE INDEX idx_users_email_active_lower ON users (lower(email)) WHERE deleted_at IS NULL;