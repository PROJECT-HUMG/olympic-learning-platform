package me.nghlong3004.olympic.daily.feedback.repository;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.daily.feedback.entity.DailyFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Repository
public interface DailyFeedbackRepository extends JpaRepository<DailyFeedback, UUID> {
  List<DailyFeedback> findByGroupIdAndPlanIdOrderByCreatedAtAscIdAsc(UUID groupId, UUID planId);

  List<DailyFeedback> findByGroupIdAndWeeklyReviewIdOrderByCreatedAtAscIdAsc(
      UUID groupId, UUID reviewId);
}
