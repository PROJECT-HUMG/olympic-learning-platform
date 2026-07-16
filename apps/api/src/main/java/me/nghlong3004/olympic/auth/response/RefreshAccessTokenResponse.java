package me.nghlong3004.olympic.auth.response;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/16/2026
 */
public record RefreshAccessTokenResponse(String accessToken, String tokenType, long expiresIn) {}
