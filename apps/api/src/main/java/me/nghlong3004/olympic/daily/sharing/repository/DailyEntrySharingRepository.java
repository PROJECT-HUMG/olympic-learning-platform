package me.nghlong3004.olympic.daily.sharing.repository;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.daily.sharing.entity.DailyEntryViewer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/16/2026
 */
public interface DailyEntrySharingRepository extends JpaRepository<DailyEntryViewer, UUID> {
  List<DailyEntryViewer> findByPlanIdOrderByGroupIdAscViewerIdAsc(UUID planId);

  boolean existsByPlanIdAndGroupIdAndViewerId(UUID planId, UUID groupId, UUID viewerId);

  @Query(
      "select v from DailyEntryViewer v where v.groupId = :groupId and (v.viewerId = :userId or"
          + " v.planId in (select p.id from DailyPlan p where p.ownerId = :userId))")
  List<DailyEntryViewer> findMembershipGrants(
      @Param("groupId") UUID groupId, @Param("userId") UUID userId);
}
