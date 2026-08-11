package me.nghlong3004.olympic.question.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.question.entity.QuestionAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Repository
public interface QuestionAssetRepository extends JpaRepository<QuestionAsset, UUID> {
  @EntityGraph(attributePaths = "file")
  List<QuestionAsset> findByQuestionIdOrderBySortOrderAsc(UUID questionId);

  @EntityGraph(attributePaths = "file")
  List<QuestionAsset> findByQuestionIdInOrderByQuestionIdAscSortOrderAsc(
      Collection<UUID> questionIds);
}
