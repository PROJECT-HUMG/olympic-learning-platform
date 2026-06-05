package me.nghlong3004.olympic.api.learning.repository;

import me.nghlong3004.olympic.api.learning.entity.LearningRoadmap;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link LearningRoadmap} entities.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Repository
public interface LearningRoadmapRepository extends JpaRepository<LearningRoadmap, Long> {

    Optional<LearningRoadmap> findByPublicId(UUID publicId);

    Page<LearningRoadmap> findBySubjectId(Long subjectId, Pageable pageable);

    Page<LearningRoadmap> findByPublishedTrue(Pageable pageable);
}
