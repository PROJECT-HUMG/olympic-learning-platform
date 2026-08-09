package me.nghlong3004.olympic.assessment.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.assessment.entity.AssessmentImportPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Repository
public interface AssessmentImportPageRepository extends JpaRepository<AssessmentImportPage, UUID> {

  List<AssessmentImportPage> findByAssessmentImportIdOrderByPageNumberAsc(UUID importId);

  Optional<AssessmentImportPage> findByAssessmentImportIdAndPageNumber(UUID importId, int pageNumber);
}
