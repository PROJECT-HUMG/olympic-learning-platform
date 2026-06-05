package me.nghlong3004.olympic.api.user.repository;

import me.nghlong3004.olympic.api.user.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link Permission} entities.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {

    Optional<Permission> findByPublicId(UUID publicId);

    Optional<Permission> findByName(String name);

    List<Permission> findByModule(String module);

    @Query("SELECT p FROM Permission p JOIN RolePermission rp ON p.id = rp.permissionId WHERE rp.roleId = :roleId")
    List<Permission> findByRoleId(Long roleId);
}
