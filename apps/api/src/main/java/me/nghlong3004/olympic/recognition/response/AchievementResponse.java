package me.nghlong3004.olympic.recognition.response;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.recognition.enums.AchievementAward;
import me.nghlong3004.olympic.recognition.enums.AchievementCategory;
import me.nghlong3004.olympic.recognition.enums.AchievementStatus;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
public record AchievementResponse(UUID id, UUID userId, String fullName, String title,
    String description, AchievementCategory category, AchievementAward award,
    boolean includeParticipation, LocalDate achievedDate, boolean publicVisible,
    AchievementStatus status, int awardPoints, int participationPoints, int totalPoints,
    String reviewNote, OffsetDateTime reviewedAt, OffsetDateTime createdAt,
    OffsetDateTime updatedAt, long version, List<RecognitionFileResponse> evidence) {}
