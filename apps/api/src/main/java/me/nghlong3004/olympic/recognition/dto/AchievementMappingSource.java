package me.nghlong3004.olympic.recognition.dto;

import java.time.OffsetDateTime;
import java.util.List;
import me.nghlong3004.olympic.recognition.entity.Achievement;
import me.nghlong3004.olympic.recognition.response.RecognitionFileResponse;

/**
 * Service-preauthorized achievement fields. Review note, review time, total points, and evidence
 * are already masked or calculated before mapping.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public record AchievementMappingSource(
    Achievement achievement,
    String fullName,
    String reviewNote,
    OffsetDateTime reviewedAt,
    int totalPoints,
    List<RecognitionFileResponse> evidence) {}
