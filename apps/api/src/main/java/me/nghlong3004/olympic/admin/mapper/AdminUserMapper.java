package me.nghlong3004.olympic.admin.mapper;

import java.util.Objects;
import java.util.Set;
import me.nghlong3004.olympic.admin.response.AdminUserResponse;
import me.nghlong3004.olympic.user.entity.AvatarCrop;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.enums.Permission;
import me.nghlong3004.olympic.user.response.AvatarCropResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AdminUserMapper {

  /**
   * A null user throws before mapping, matching {@code AdminUserResponse.fromEntity}.
   */
  default AdminUserResponse toResponse(User user, String avatarUrl) {
    return toMappedResponse(Objects.requireNonNull(user), avatarUrl);
  }

  @Mapping(target = "avatarUrl", source = "avatarUrl")
  @Mapping(target = "avatarCrop", source = "user.avatarCrop", qualifiedByName = "avatarCrop")
  @Mapping(target = "permissions", source = "user.permissions", qualifiedByName = "samePermissions")
  AdminUserResponse toMappedResponse(User user, String avatarUrl);

  /** Delegates to AvatarCropResponse.fromEntity, including its null-crop result. */
  @Named("avatarCrop")
  default AvatarCropResponse avatarCrop(AvatarCrop crop) {
    return AvatarCropResponse.fromEntity(crop);
  }

  /** Keeps the persisted permission set, including a null or empty set. */
  @Named("samePermissions")
  default Set<Permission> samePermissions(Set<Permission> permissions) {
    return permissions;
  }
}
