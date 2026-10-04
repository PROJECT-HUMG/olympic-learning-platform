package me.nghlong3004.olympic.daily.feedback.response;

import java.util.List;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public record DailyFeedbackResponse(
    List<DailyFeedbackContributionResponse> contributions, int contributorCount) {}
