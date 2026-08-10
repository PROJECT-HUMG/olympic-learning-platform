package me.nghlong3004.olympic.question.repository;

import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.question.entity.Question;
import me.nghlong3004.olympic.question.enums.QuestionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** @author nghlong3004 (Long Nguyen Hoang) @since 8/10/2026 */
public interface QuestionRepository extends JpaRepository<Question, UUID> {
  @Query("""
      select q from Question q
      where (:ownerId is null or q.createdBy.id = :ownerId)
        and (:status is null or q.status = :status)
        and (:subjectId is null or q.subject.id = :subjectId)
        and (:topicId is null or q.topic.id = :topicId)
        and (:search is null or lower(cast(q.contentJson as string)) like lower(concat('%', :search, '%')))
      order by q.updatedAt desc
      """)
  Page<Question> search(@Param("ownerId") UUID ownerId, @Param("status") QuestionStatus status, @Param("subjectId") UUID subjectId,
      @Param("topicId") UUID topicId, @Param("search") String search, Pageable pageable);

  Optional<Question> findByIdAndCreatedById(UUID id, UUID createdById);
}
