package me.nghlong3004.olympic.api.learning.repository;

import me.nghlong3004.olympic.api.learning.entity.Topic;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link Topic} entities.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Repository
public interface TopicRepository extends JpaRepository<Topic, Long> {

    Optional<Topic> findByPublicId(UUID publicId);

    @Query("SELECT t FROM Topic t WHERE t.subject.id = :subjectId ORDER BY t.displayOrder ASC")
    Page<Topic> findBySubjectId(Long subjectId, Pageable pageable);

    @Query("SELECT t FROM Topic t WHERE t.subject.publicId = :subjectPublicId ORDER BY t.displayOrder ASC")
    Page<Topic> findBySubjectPublicId(UUID subjectPublicId, Pageable pageable);

    List<Topic> findByParentId(Long parentId);

    @Query("SELECT t FROM Topic t WHERE t.subject.id = :subjectId AND t.parent IS NULL ORDER BY t.displayOrder ASC")
    List<Topic> findRootTopicsBySubjectId(Long subjectId);
}
