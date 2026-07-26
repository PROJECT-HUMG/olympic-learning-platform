CREATE TABLE user_permissions (
    user_id UUID NOT NULL,
    permission VARCHAR(255) NOT NULL,
    PRIMARY KEY (user_id, permission),
    CONSTRAINT fk_user_permissions_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_user_permissions_user_id ON user_permissions (user_id);
