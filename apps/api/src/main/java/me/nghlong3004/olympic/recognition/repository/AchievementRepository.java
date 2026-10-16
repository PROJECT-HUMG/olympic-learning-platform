package me.nghlong3004.olympic.recognition.repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.recognition.entity.Achievement;
import me.nghlong3004.olympic.recognition.enums.AchievementStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
@Repository
public interface AchievementRepository extends JpaRepository<Achievement, UUID> {
  @Query("select a.userId from Achievement a where a.id = :id")
  Optional<UUID> findOwnerIdById(@Param("id") UUID id);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select a from Achievement a where a.id = :id")
  Optional<Achievement> findForUpdateById(@Param("id") UUID id);

  @Lock(LockModeType.PESSIMISTIC_FORCE_INCREMENT)
  @Query("select a from Achievement a where a.id = :id")
  Optional<Achievement> findForResubmissionById(@Param("id") UUID id);

  List<Achievement> findByUserIdOrderByAchievedDateDescCreatedAtDesc(UUID userId);

  List<Achievement> findByUserIdAndStatusAndPublicVisibleTrueOrderByAchievedDateDescCreatedAtDesc(
      UUID userId, AchievementStatus status);

  long countByUserIdAndStatus(UUID userId, AchievementStatus status);

  @Query(
      "select a from Achievement a where (:status is null or a.status = :status) and (:userId is"
          + " null or a.userId = :userId)")
  Page<Achievement> filter(
      @Param("status") AchievementStatus status, @Param("userId") UUID userId, Pageable pageable);

  @Query(
      value =
          """
          WITH scores AS (
            SELECT u.id AS user_id, u.full_name, u.username,
              COALESCE(SUM(a.award_points + a.participation_points), 0) AS total_points,
              COUNT(a.id) AS approved_count
            FROM users u JOIN recognition_preferences p ON p.user_id = u.id AND p.ranking_opt_in = true
            JOIN recognition_achievements a ON a.user_id = u.id AND a.status = 'APPROVED'
              AND (CAST(:year AS integer) IS NULL OR EXTRACT(YEAR FROM a.achieved_date) = CAST(:year AS integer))
            WHERE u.role = 'STUDENT' AND u.status = 'ACTIVE' AND u.deleted_at IS NULL
            GROUP BY u.id, u.full_name, u.username
          )
          SELECT ROW_NUMBER() OVER (
              ORDER BY s.total_points DESC, timing.recorded_at ASC NULLS LAST, s.user_id ASC
            ) AS rank, s.user_id AS "userId", s.full_name AS "fullName", s.username,
            s.total_points AS "totalPoints", s.approved_count AS "approvedCount",
            (timing.recorded_at IS NOT NULL) AS "scoreTimingKnown"
          FROM scores s
          LEFT JOIN LATERAL (
            SELECT e.recorded_at FROM recognition_score_events e
            WHERE e.user_id = s.user_id
              AND (CAST(:year AS integer) IS NULL OR e.achieved_year = CAST(:year AS integer))
            ORDER BY e.id DESC LIMIT 1
          ) timing ON true
          ORDER BY s.total_points DESC, timing.recorded_at ASC NULLS LAST, s.user_id ASC
          """,
      countQuery =
          """
          SELECT COUNT(*) FROM users u JOIN recognition_preferences p ON p.user_id = u.id AND p.ranking_opt_in = true
          WHERE u.role = 'STUDENT' AND u.status = 'ACTIVE' AND u.deleted_at IS NULL
          AND EXISTS (SELECT 1 FROM recognition_achievements a WHERE a.user_id = u.id AND a.status = 'APPROVED'
            AND (CAST(:year AS integer) IS NULL OR EXTRACT(YEAR FROM a.achieved_date) = CAST(:year AS integer)))
          """,
      nativeQuery = true)
  Page<RankingProjection> rankings(@Param("year") Integer year, Pageable pageable);

  interface RankingProjection {
    long getRank();

    UUID getUserId();

    String getFullName();

    String getUsername();

    long getTotalPoints();

    long getApprovedCount();

    boolean getScoreTimingKnown();
  }
}
