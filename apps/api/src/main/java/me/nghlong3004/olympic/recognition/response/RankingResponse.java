package me.nghlong3004.olympic.recognition.response;

import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
public record RankingResponse(long rank, UUID userId, String fullName, String username, long totalPoints, long approvedCount) {}
