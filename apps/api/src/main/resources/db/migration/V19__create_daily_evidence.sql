-- Evidence belongs to a saved task; its plan/owner are resolved through that task, not duplicated.
CREATE TABLE daily_evidence (
    id uuid PRIMARY KEY,
    task_id uuid NOT NULL REFERENCES daily_tasks(id) ON DELETE CASCADE,
    stage varchar(16) NOT NULL CHECK (stage IN ('START', 'FINISH')),
    kind varchar(16) NOT NULL CHECK (kind IN ('FILE', 'LINK')),
    original_name varchar(255),
    content_type varchar(255),
    size_bytes bigint,
    content bytea,
    url varchar(2048),
    label varchar(200),
    created_at timestamptz NOT NULL,
    CONSTRAINT ck_daily_evidence_payload CHECK (
        (kind = 'FILE' AND original_name IS NOT NULL AND char_length(original_name) > 0
            AND content_type IS NOT NULL AND char_length(content_type) > 0
            AND size_bytes IS NOT NULL AND size_bytes BETWEEN 1 AND 5242880
            AND content IS NOT NULL AND octet_length(content) = size_bytes
            AND url IS NULL AND label IS NULL)
        OR
        (kind = 'LINK' AND original_name IS NULL AND content_type IS NULL
            AND size_bytes IS NULL AND content IS NULL
            AND url IS NOT NULL AND char_length(url) > 0
            AND label IS NOT NULL AND char_length(btrim(label)) > 0)
    )
);
CREATE INDEX idx_daily_evidence_task ON daily_evidence(task_id);
