package me.nghlong3004.olympic.recognition.response;

import java.time.LocalDate;
import java.util.UUID;
import me.nghlong3004.olympic.recognition.enums.AchievementAward;
import me.nghlong3004.olympic.recognition.enums.AchievementCategory;
import me.nghlong3004.olympic.recognition.enums.AchievementStatus;

/**
 * Approved public academic details only; no review, evidence, actor or version fields.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/10/2026
 */
public record PublicAchievementResponse(UUID id, String title, String description,
    AchievementCategory category, AchievementAward award, boolean includeParticipation,
    LocalDate achievedDate, boolean publicVisible, AchievementStatus status,
    int awardPoints, int participationPoints, int totalPoints) {}
