package me.nghlong3004.olympic.daily.feedback.service;

import java.util.UUID;
import me.nghlong3004.olympic.daily.feedback.request.SaveDailyFeedbackRequest;
import me.nghlong3004.olympic.daily.feedback.response.DailyFeedbackContributionResponse;
import me.nghlong3004.olympic.daily.feedback.response.DailyFeedbackResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public interface DailyFeedbackService {
  /**
   * Filters contributors through their current permission to see the saved recipient review.
   *
   * @param groupId current context
   * @param ownerId recipient
   * @param kind plans or weeks
   * @param reviewId saved review
   * @return currently permitted identified contributors and distinct person count
   */
  DailyFeedbackResponse list(UUID groupId, UUID ownerId, String kind, UUID reviewId);

  /**
   * Creates or updates only the authenticated non-recipient's own contribution under current
   * access.
   *
   * @param groupId current context
   * @param ownerId recipient
   * @param kind plans or weeks
   * @param reviewId saved review
   * @param request text and exact prior version; null version for creation only
   * @return own persisted contribution
   */
  DailyFeedbackContributionResponse save(
      UUID groupId, UUID ownerId, String kind, UUID reviewId, SaveDailyFeedbackRequest request);

  /**
   * Deletes only the current authenticated author's version-matched contribution.
   *
   * @param groupId current context
   * @param ownerId recipient
   * @param kind plans or weeks
   * @param reviewId saved review
   * @param expectedVersion exact own version
   */
  void remove(UUID groupId, UUID ownerId, String kind, UUID reviewId, Long expectedVersion);
}
