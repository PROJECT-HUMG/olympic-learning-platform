package me.nghlong3004.olympic.user.mapper;

import me.nghlong3004.olympic.auth.response.CurrentUserResponse;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.response.UserResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/15/2026
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {

  @Mapping(target = "avatarUrl", ignore = true)
  UserResponse toResponse(User user);

  @Mapping(target = "avatarUrl", ignore = true)
  CurrentUserResponse toCurrentUserResponse(User user);
}
