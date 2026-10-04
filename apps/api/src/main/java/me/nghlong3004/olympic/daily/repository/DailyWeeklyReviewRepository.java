package me.nghlong3004.olympic.daily.repository;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.daily.entity.DailyWeeklyReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Repository
public interface DailyWeeklyReviewRepository extends JpaRepository<DailyWeeklyReview, UUID> {
  Optional<DailyWeeklyReview> findByOwnerIdAndWeekStart(UUID ownerId, LocalDate weekStart);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query(
      "select review from DailyWeeklyReview review where review.ownerId = :ownerId and review.weekStart = :weekStart")
  Optional<DailyWeeklyReview> findForUpdateByOwnerIdAndWeekStart(
      @Param("ownerId") UUID ownerId, @Param("weekStart") LocalDate weekStart);
}
