package me.nghlong3004.olympic.question.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.question.entity.QuestionFigure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Repository
public interface QuestionFigureRepository extends JpaRepository<QuestionFigure, UUID> {
  Optional<QuestionFigure> findByIdAndQuestionId(UUID id, UUID questionId);

  List<QuestionFigure> findByQuestionId(UUID questionId);

  /** Lock only IDs before publication reads/copies bytes, inside the caller's transaction. */
  @Query(
      value =
          "select id from question_figures where question_id = :questionId order by id for update",
      nativeQuery = true)
  List<UUID> lockIdsByQuestionId(@Param("questionId") UUID questionId);

  long countByQuestionId(UUID questionId);
}
