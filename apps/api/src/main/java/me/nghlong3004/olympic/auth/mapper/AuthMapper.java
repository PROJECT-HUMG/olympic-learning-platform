package me.nghlong3004.olympic.auth.mapper;

import me.nghlong3004.olympic.auth.response.CurrentUserResponse;
import me.nghlong3004.olympic.user.entity.User;
import org.mapstruct.Mapper;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/16/2026
 */
@Mapper(componentModel = "spring")
public interface AuthMapper {
  CurrentUserResponse toResponse(User user);
}
