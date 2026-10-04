package me.nghlong3004.olympic.admin.mapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import me.nghlong3004.olympic.user.entity.AvatarCrop;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.enums.Permission;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;
import me.nghlong3004.olympic.user.response.AvatarCropResponse;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
class AdminUserMapperTest {

  private final AdminUserMapper mapper = Mappers.getMapper(AdminUserMapper.class);

  @Test
  void nullUserThrowsBeforePartialMapping() {
    assertThatThrownBy(() -> mapper.toResponse(null, "https://cdn.example/avatar.png"))
        .isInstanceOf(NullPointerException.class);
    assertThatThrownBy(() -> mapper.toResponse(null, null)).isInstanceOf(NullPointerException.class);
  }

  @Test
  void mapsSearchFieldsAndKeepsThePermissionSet() {
    var permissions = new LinkedHashSet<Permission>();
    permissions.add(Permission.DOCUMENT_UPLOAD);
    var user =
        User.builder()
            .id(UUID.randomUUID())
            .email("admin@example.com")
            .username("admin")
            .fullName("Admin User")
            .role(Role.ADMIN)
            .status(Status.ACTIVE)
            .permissions(permissions)
            .lastLoginAt(OffsetDateTime.parse("2026-07-30T00:00:00Z"))
            .createdAt(OffsetDateTime.parse("2026-07-01T00:00:00Z"))
            .passwordHash("secret-hash")
            .build();

    var response = mapper.toResponse(user, null);

    assertThat(response.id()).isEqualTo(user.getId());
    assertThat(response.email()).isEqualTo("admin@example.com");
    assertThat(response.username()).isEqualTo("admin");
    assertThat(response.fullName()).isEqualTo("Admin User");
    assertThat(response.avatarUrl()).isNull();
    assertThat(response.avatarCrop()).isNull();
    assertThat(response.role()).isEqualTo(Role.ADMIN);
    assertThat(response.status()).isEqualTo(Status.ACTIVE);
    assertThat(response.permissions()).isSameAs(permissions);
    assertThat(response.lastLoginAt()).isEqualTo(user.getLastLoginAt());
    assertThat(response.createdAt()).isEqualTo(user.getCreatedAt());
    assertThat(response.toString()).doesNotContain("secret-hash");
  }

  @Test
  void mapsCropThroughTheSharedFactoryAndUsesTheGivenAvatarUrl() {
    var crop = new AvatarCrop(0.25, 0.5, 1.5);
    var permissions = Set.<Permission>of();
    var user =
        User.builder()
            .id(UUID.randomUUID())
            .email("lecturer@example.com")
            .username("lecturer")
            .fullName("Lecturer")
            .role(Role.LECTURER)
            .status(Status.PENDING)
            .permissions(permissions)
            .avatarCrop(crop)
            .build();

    var response = mapper.toResponse(user, "https://cdn.example/avatar.png");

    assertThat(response.avatarUrl()).isEqualTo("https://cdn.example/avatar.png");
    assertThat(response.avatarCrop()).isEqualTo(AvatarCropResponse.fromEntity(crop));
    assertThat(response.permissions()).isSameAs(permissions);
  }

  @Test
  void keepsANullPermissionSet() {
    var user =
        User.builder()
            .id(UUID.randomUUID())
            .email("student@example.com")
            .username("student")
            .fullName("Student")
            .permissions(null)
            .build();

    assertThat(mapper.toResponse(user, "https://cdn.example/default.png").permissions()).isNull();
  }

  @Test
  void nullCropComponentFollowsTheSharedFactory() {
    var user =
        User.builder()
            .id(UUID.randomUUID())
            .email("student@example.com")
            .username("student")
            .fullName("Student")
            .avatarCrop(new AvatarCrop(null, 0.5, 1.0))
            .build();

    assertThatThrownBy(() -> mapper.toResponse(user, "https://cdn.example/default.png"))
        .isInstanceOf(NullPointerException.class);
  }
}
