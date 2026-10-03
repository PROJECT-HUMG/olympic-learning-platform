package me.nghlong3004.olympic.recognition.response;

import java.util.List;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
public record RecognitionProfileResponse(UUID userId, String fullName, String username,
    boolean rankingOptIn, long publicPoints, List<AchievementResponse> achievements) {}
