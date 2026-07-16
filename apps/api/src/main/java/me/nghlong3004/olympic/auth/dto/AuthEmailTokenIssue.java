package me.nghlong3004.olympic.auth.dto;

import java.time.OffsetDateTime;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/16/2026
 */
public record AuthEmailTokenIssue(String token, OffsetDateTime expiresAt) {}
