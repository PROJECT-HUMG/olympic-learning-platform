package me.nghlong3004.olympic.api.learning.repository;

import me.nghlong3004.olympic.api.learning.entity.Subject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link Subject} entities.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {

    Optional<Subject> findByPublicId(UUID publicId);

    Optional<Subject> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByName(String name);

    Page<Subject> findByActiveTrue(Pageable pageable);

    @Query("SELECT s FROM Subject s ORDER BY s.displayOrder ASC")
    Page<Subject> findAllOrdered(Pageable pageable);
}
