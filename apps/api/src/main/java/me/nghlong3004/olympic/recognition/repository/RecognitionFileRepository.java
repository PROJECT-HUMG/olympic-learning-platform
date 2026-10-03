package me.nghlong3004.olympic.recognition.repository;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.recognition.entity.RecognitionFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Metadata projections prevent gallery/review lists from loading binary payloads.
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
@Repository
public interface RecognitionFileRepository extends JpaRepository<RecognitionFile, UUID> {
  @Query("""
      select f.id as id, f.originalName as originalName, f.contentType as contentType,
      f.size as size, f.position as position from RecognitionFile f
      where f.honorId = :id order by f.position asc, f.id asc
      """)
  List<Metadata> metadataForHonor(@Param("id") UUID id);
  @Query("""
      select f.id as id, f.originalName as originalName, f.contentType as contentType,
      f.size as size, f.position as position from RecognitionFile f
      where f.achievementId = :id order by f.position asc, f.id asc
      """)
  List<Metadata> metadataForAchievement(@Param("id") UUID id);
  @Modifying
  @Query("delete from RecognitionFile f where f.achievementId = :id")
  void deleteForAchievement(@Param("id") UUID id);

  interface Metadata {
    UUID getId();
    String getOriginalName();
    String getContentType();
    long getSize();
    int getPosition();
  }
}
