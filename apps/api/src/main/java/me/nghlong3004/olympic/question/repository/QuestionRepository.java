package me.nghlong3004.olympic.question.repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.question.entity.Question;
import me.nghlong3004.olympic.question.enums.QuestionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {
  @Query(
      """
      select q from Question q
      where (:ownerId is null or q.status = :published or q.createdBy.id = :ownerId)
        and (:status is null or q.status = :status)
        and (:subjectId is null or q.subject.id = :subjectId)
        and (:topicId is null or q.topic.id = :topicId)
        and (:search is null or lower(cast(q.contentJson as string)) like lower(concat('%', cast(:search as string), '%')))
      order by q.updatedAt desc
      """)
  @EntityGraph(attributePaths = {"subject", "topic", "createdBy"})
  Page<Question> search(
      @Param("ownerId") UUID ownerId,
      @Param("published") QuestionStatus published,
      @Param("status") QuestionStatus status,
      @Param("subjectId") UUID subjectId,
      @Param("topicId") UUID topicId,
      @Param("search") String search,
      Pageable pageable);

  @EntityGraph(attributePaths = {"subject", "topic", "createdBy"})
  Optional<Question> findByIdAndCreatedById(UUID id, UUID createdById);

  @EntityGraph(attributePaths = {"subject", "topic", "createdBy"})
  @Query("select question from Question question where question.id = :id")
  Optional<Question> findDetailedById(@Param("id") UUID id);

  @EntityGraph(attributePaths = {"subject", "topic", "createdBy"})
  @Query("""
      select question from Question question
      where question.id = :id
        and (question.status = :published or question.createdBy.id = :ownerId)
      """)
  Optional<Question> findVisibleById(
      @Param("id") UUID id,
      @Param("ownerId") UUID ownerId,
      @Param("published") QuestionStatus published);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select question from Question question where question.id = :id")
  Optional<Question> findForUpdateById(@Param("id") UUID id);
}
