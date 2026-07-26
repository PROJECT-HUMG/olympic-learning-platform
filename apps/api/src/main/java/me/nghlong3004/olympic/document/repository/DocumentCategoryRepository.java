package me.nghlong3004.olympic.document.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.document.entity.DocumentCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
@Repository
public interface DocumentCategoryRepository extends JpaRepository<DocumentCategory, UUID> {

  Optional<DocumentCategory> findByIdAndEnabledTrue(UUID id);

  boolean existsByCode(String code);

  boolean existsBySlug(String slug);
  
  List<DocumentCategory> findAllByEnabledTrueOrderByNameAsc();
}
