package me.nghlong3004.olympic.post.repository;

import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.post.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/04/2026
 */
@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

  Optional<Post> findBySlug(String slug);

  boolean existsBySlug(String slug);
}
