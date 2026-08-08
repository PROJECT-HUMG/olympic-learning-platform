package me.nghlong3004.olympic.post.repository;

import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.post.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import me.nghlong3004.olympic.post.enums.PostType;
import me.nghlong3004.olympic.post.enums.PostStatus;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/04/2026
 */
@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

  Optional<Post> findBySlug(String slug);

  boolean existsBySlug(String slug);

  @Query("SELECT p FROM Post p WHERE " +
         "(:type IS NULL OR p.type = :type) AND " +
         "(:status IS NULL OR p.status = :status) AND " +
         "(:keyword IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')))")
  Page<Post> searchPosts(@Param("keyword") String keyword, 
                         @Param("type") PostType type, 
                         @Param("status") PostStatus status, 
                         Pageable pageable);
}
