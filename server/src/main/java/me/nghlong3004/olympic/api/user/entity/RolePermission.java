package me.nghlong3004.olympic.api.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

/**
 * JPA entity representing the many-to-many join between {@link Role} and {@link Permission}.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Entity
@Table(name = "role_permissions")
@IdClass(RolePermission.RolePermissionId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RolePermission {

    @Id
    @Column(name = "role_id")
    private Long roleId;

    @Id
    @Column(name = "permission_id")
    private Long permissionId;

    /**
     * Composite primary key for role_permissions.
     */
    public static class RolePermissionId implements Serializable {
        private Long roleId;
        private Long permissionId;

        public RolePermissionId() {}

        public RolePermissionId(Long roleId, Long permissionId) {
            this.roleId = roleId;
            this.permissionId = permissionId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            RolePermissionId that = (RolePermissionId) o;
            return Objects.equals(roleId, that.roleId) &&
                   Objects.equals(permissionId, that.permissionId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(roleId, permissionId);
        }
    }
}
