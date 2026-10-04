package me.nghlong3004.olympic.daily.repository;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.daily.entity.DailyPlan;
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
public interface DailyPlanRepository extends JpaRepository<DailyPlan, UUID> {
  Optional<DailyPlan> findByOwnerIdAndPlanDate(UUID ownerId, LocalDate planDate);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select plan from DailyPlan plan where plan.id = :id")
  Optional<DailyPlan> findForUpdateById(@Param("id") UUID id);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query(
      "select plan from DailyPlan plan where plan.ownerId = :ownerId and plan.planDate = :planDate")
  Optional<DailyPlan> findForUpdateByOwnerIdAndPlanDate(
      @Param("ownerId") UUID ownerId, @Param("planDate") LocalDate planDate);

  @Query(
      """
      select distinct plan from DailyPlan plan left join fetch plan.tasks
      where plan.ownerId = :ownerId and plan.planDate >= :start and plan.planDate < :end
      """)
  List<DailyPlan> findOwnedBetween(
      @Param("ownerId") UUID ownerId, @Param("start") LocalDate start, @Param("end") LocalDate end);
}
