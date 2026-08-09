package me.nghlong3004.olympic.assessment.repository;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.assessment.entity.AssessmentQuestionDraftAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Repository
public interface AssessmentQuestionDraftAssetRepository
    extends JpaRepository<AssessmentQuestionDraftAsset, UUID> {

  List<AssessmentQuestionDraftAsset> findByDraftIdOrderBySortOrderAsc(UUID draftId);
}
