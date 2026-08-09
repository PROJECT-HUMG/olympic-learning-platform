package me.nghlong3004.olympic.post.repository;

import jakarta.persistence.LockModeType;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.post.entity.Post;
import me.nghlong3004.olympic.post.enums.PostStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/04/2026
 */
@Repository
public interface PostRepository extends JpaRepository<Post, UUID>, JpaSpecificationExecutor<Post> {

  Optional<Post> findBySlug(String slug);

  boolean existsBySlug(String slug);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("""
      select p from Post p
      where p.deletedAt is null
        and p.pinned = true
        and p.status = :status
        and (p.expiredAt is null or p.expiredAt > :now)
      """)
  List<Post> findActivePinnedPostsForUpdate(
      @Param("status") PostStatus status, @Param("now") OffsetDateTime now);
}
