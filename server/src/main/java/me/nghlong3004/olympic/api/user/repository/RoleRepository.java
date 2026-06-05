package me.nghlong3004.olympic.api.user.repository;

import me.nghlong3004.olympic.api.user.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link Role} entities.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(String name);

    Optional<Role> findByPublicId(UUID publicId);

    boolean existsByName(String name);
}
