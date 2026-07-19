CREATE TYPE auth_email_token_purpose AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'ADMIN_INVITE');
CREATE TYPE auth_email_token_status AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'REVOKED');
CREATE TYPE auth_refresh_token_status AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

CREATE TABLE auth_email_tokens
(
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid                     NOT NULL,
    token_hash varchar(255)             NOT NULL,
    purpose    auth_email_token_purpose NOT NULL,
    status     auth_email_token_status  NOT NULL,
    issued_at  timestamptz              NOT NULL,
    expires_at timestamptz              NOT NULL,
    used_at    timestamptz,
    revoked_at timestamptz,
    created_ip varchar(255),
    user_agent varchar(1024),
    CONSTRAINT fk_auth_email_tokens_user_id FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_auth_email_tokens_token_hash ON auth_email_tokens (token_hash);

CREATE TABLE auth_refresh_tokens
(
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid                      NOT NULL,
    token_hash varchar(255)              NOT NULL,
    family_id  uuid                      NOT NULL,
    status     auth_refresh_token_status NOT NULL,
    issued_at  timestamptz               NOT NULL,
    expires_at timestamptz               NOT NULL,
    rotated_at timestamptz,
    revoked_at timestamptz,
    created_ip varchar(255),
    user_agent varchar(1024),
    CONSTRAINT fk_auth_refresh_tokens_user_id FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_auth_refresh_tokens_token_hash ON auth_refresh_tokens (token_hash);
CREATE INDEX idx_auth_refresh_tokens_family_id ON auth_refresh_tokens (family_id);