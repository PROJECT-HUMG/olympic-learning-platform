package me.nghlong3004.olympic.daily.evidence.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.daily.evidence.entity.DailyEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Repository
public interface DailyEvidenceRepository extends JpaRepository<DailyEvidence, UUID> {
  List<DailyEvidence> findByTask_IdOrderByCreatedAtAscIdAsc(UUID taskId);

  Optional<DailyEvidence> findByIdAndTask_Id(UUID id, UUID taskId);

  long countByTask_Id(UUID taskId);
}
