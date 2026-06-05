package me.nghlong3004.olympic.api.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * Base entity with soft-delete support for important data that must be preserved.
 *
 * <p>Extends {@link BaseEntity} with {@code deleted}, {@code deletedAt}, and {@code deletedBy} fields.
 * Queries should filter by {@code deleted = false} using partial indexes or {@code @Where} clause.
 *
 * @author nghlong3004
 * @since 2026-06-05
 * @see BaseEntity
 */
@MappedSuperclass
@Getter
@Setter
public abstract class SoftDeletableEntity extends BaseEntity {

    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "deleted_by")
    private Long deletedBy;

    /**
     * Marks this entity as soft-deleted.
     *
     * @param deletedBy the ID of the user performing the deletion
     */
    public void softDelete(Long deletedBy) {
        this.deleted = true;
        this.deletedAt = Instant.now();
        this.deletedBy = deletedBy;
    }

    /**
     * Restores a soft-deleted entity.
     */
    public void restore() {
        this.deleted = false;
        this.deletedAt = null;
        this.deletedBy = null;
    }
}
