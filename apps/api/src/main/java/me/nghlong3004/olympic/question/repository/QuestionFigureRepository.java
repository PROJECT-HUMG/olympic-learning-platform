package me.nghlong3004.olympic.question.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.question.entity.QuestionFigure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Repository
public interface QuestionFigureRepository extends JpaRepository<QuestionFigure, UUID> {
  Optional<QuestionFigure> findByIdAndQuestionId(UUID id, UUID questionId);

  List<QuestionFigure> findByQuestionId(UUID questionId);

  long countByQuestionId(UUID questionId);
}
