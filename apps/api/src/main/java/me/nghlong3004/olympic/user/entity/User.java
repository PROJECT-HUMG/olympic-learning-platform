package me.nghlong3004.olympic.user.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import me.nghlong3004.olympic.storage.entity.FileEntity;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;
import me.nghlong3004.olympic.user.exception.UserDisabledException;
import me.nghlong3004.olympic.user.exception.UserPendingException;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/15/2026
 */
@Entity
@Getter
@Setter
@Builder
@Table(name = "users")
@NoArgsConstructor
@AllArgsConstructor
public class User {
  @Id
  @Column(nullable = false, updatable = false)
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false, unique = true, length = 100)
  private String email;

  @Column(nullable = false, unique = true, length = 100)
  private String username;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(nullable = false)
  @Builder.Default
  private Role role = Role.STUDENT;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(nullable = false)
  @Builder.Default
  private Status status = Status.PENDING;

  @Column(name = "full_name")
  private String fullName;

  @Column(name = "password_hash")
  private String passwordHash;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "avatar_id")
  private FileEntity avatar;

  @Column(name = "last_login_at")
  private OffsetDateTime lastLoginAt;

  @Column(name = "deleted_at")
  private OffsetDateTime deletedAt;

  @Column(name = "updated_at", nullable = false)
  @Builder.Default
  private OffsetDateTime updatedAt = OffsetDateTime.now();

  @Column(name = "created_at", nullable = false, updatable = false)
  @Builder.Default
  private OffsetDateTime createdAt = OffsetDateTime.now();

  @PreUpdate
  void preUpdate() {
    updatedAt = OffsetDateTime.now();
  }

  public boolean active() {
    return status == Status.ACTIVE && deletedAt == null;
  }

  public void requireActiveForAuth() {
    if (this.status == Status.PENDING) {
      throw new UserPendingException();
    }
    if (this.deletedAt != null || this.status == Status.DISABLED || !this.active()) {
      throw new UserDisabledException();
    }
  }

  public void requireNotDisabled() {
    if (this.deletedAt != null || this.status == Status.DISABLED) {
      throw new UserDisabledException();
    }
  }
}
