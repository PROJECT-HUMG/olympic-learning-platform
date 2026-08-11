package me.nghlong3004.olympic.assessment.repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.assessment.entity.AssessmentImport;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Repository
public interface AssessmentImportRepository extends JpaRepository<AssessmentImport, UUID> {

  Optional<AssessmentImport> findByIdAndCreatedById(UUID id, UUID createdById);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  Optional<AssessmentImport> findForUpdateById(UUID id);

  Optional<AssessmentImport> findFirstByStatusOrderByCreatedAtAsc(AssessmentImportStatus status);
}
