package me.nghlong3004.olympic.api.user.repository;

import me.nghlong3004.olympic.api.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link User} entities.
 *
 * <p>All queries filter by {@code deleted = false} to support soft-delete (D3).
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @Query("SELECT u FROM User u WHERE u.publicId = :publicId AND u.deleted = false")
    Optional<User> findByPublicId(UUID publicId);

    @Query("SELECT u FROM User u WHERE u.email = :email AND u.deleted = false")
    Optional<User> findByEmail(String email);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE u.email = :email AND u.deleted = false")
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.deleted = false")
    Page<User> findAllActive(Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role.name = :roleName AND u.deleted = false")
    Page<User> findByRoleName(String roleName, Pageable pageable);
}
