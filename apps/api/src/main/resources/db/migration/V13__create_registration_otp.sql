CREATE TABLE auth_registration_challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES users(id),
    session_hash varchar(64) NOT NULL UNIQUE,
    code_hash varchar(64) NOT NULL,
    email varchar(100) NOT NULL,
    expires_at timestamptz NOT NULL,
    session_expires_at timestamptz NOT NULL,
    resend_available_at timestamptz NOT NULL,
    failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts BETWEEN 0 AND 5),
    verified_at timestamptz
);
CREATE TABLE auth_registration_rate_limits (
    bucket_key varchar(64) PRIMARY KEY,
    hits integer NOT NULL CHECK (hits > 0),
    expires_at timestamptz NOT NULL
);
CREATE INDEX idx_registration_rate_limits_expiry ON auth_registration_rate_limits(expires_at);
