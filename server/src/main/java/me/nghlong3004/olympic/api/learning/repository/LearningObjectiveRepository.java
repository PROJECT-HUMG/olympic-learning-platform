package me.nghlong3004.olympic.api.learning.repository;

import me.nghlong3004.olympic.api.learning.entity.LearningObjective;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link LearningObjective} entities.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Repository
public interface LearningObjectiveRepository extends JpaRepository<LearningObjective, Long> {

    Optional<LearningObjective> findByPublicId(UUID publicId);

    Optional<LearningObjective> findByCode(String code);

    boolean existsByCode(String code);

    List<LearningObjective> findByTopicId(Long topicId);
}
