package me.nghlong3004.olympic.user.mapper;

import me.nghlong3004.olympic.auth.response.CurrentUserResponse;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.response.UserResponse;
import me.nghlong3004.olympic.user.response.PublicUserIdentityResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/15/2026
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {

  default PublicUserIdentityResponse toPublicResponse(User user) {
    return user == null ? null : PublicUserIdentityResponse.fromUser(user);
  }

  @Mapping(target = "avatarUrl", ignore = true)
  UserResponse toResponse(User user);

  @Mapping(target = "avatarUrl", ignore = true)
  CurrentUserResponse toCurrentUserResponse(User user);
}
