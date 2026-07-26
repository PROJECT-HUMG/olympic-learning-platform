package me.nghlong3004.olympic.document.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.document.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
@Repository
public interface TagRepository extends JpaRepository<Tag, UUID> {

  List<Tag> findAllByIdInAndEnabledTrue(Collection<UUID> ids);

  boolean existsByCode(String code);

  boolean existsBySlug(String slug);
  
  List<Tag> findAllByEnabledTrueOrderByNameAsc();
}
