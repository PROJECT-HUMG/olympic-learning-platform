package me.nghlong3004.olympic.document.repository;

import static jakarta.persistence.LockModeType.PESSIMISTIC_WRITE;

import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.document.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
@Repository
public interface DocumentRepository
    extends JpaRepository<Document, UUID>, JpaSpecificationExecutor<Document> {

  /**
   * Retrieves an active document by its identifier.
   *
   * @param id the document identifier
   * @return an optional containing the document if found
   */
  Optional<Document> findByIdAndDeletedAtIsNull(UUID id);

  /**
   * Retrieves an active document by its slug.
   *
   * @param slug the document slug
   * @return an optional containing the document if found
   */
  Optional<Document> findBySlugAndDeletedAtIsNull(String slug);

  /**
   * Checks whether a slug already exists.
   *
   * @param slug the slug
   * @return {@code true} if the slug exists
   */
  boolean existsBySlug(String slug);

  @Lock(PESSIMISTIC_WRITE)
  Optional<Document> findForUpdateById(UUID id);

  @Modifying
  @Query("UPDATE Document d SET d.deletedAt = CURRENT_TIMESTAMP WHERE d.id IN :ids AND d.deletedAt IS NULL")
  int softDeleteByIds(@Param("ids") List<UUID> ids);

  @Modifying
  @Query("UPDATE Document d SET d.deletedAt = CURRENT_TIMESTAMP WHERE d.createdBy = :userId AND d.deletedAt IS NULL")
  int softDeleteByCreatedBy(@Param("userId") UUID userId);

  @Modifying
  @Query("UPDATE Document d SET d.viewCount = d.viewCount + 1 WHERE d.id = :id AND d.deletedAt IS NULL")
  void incrementViewCount(@Param("id") UUID id);

  @Modifying
  @Query("UPDATE Document d SET d.viewCount = d.viewCount + 1 WHERE d.slug = :slug AND d.deletedAt IS NULL")
  void incrementViewCountBySlug(@Param("slug") String slug);

  @Modifying
  @Query("UPDATE Document d SET d.downloadCount = d.downloadCount + 1 WHERE d.id = :id AND d.deletedAt IS NULL")
  void incrementDownloadCount(@Param("id") UUID id);
}
