package me.nghlong3004.olympic.user.mapper;

import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.response.UserResponse;
import org.mapstruct.Mapper;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/15/2026
 */
@Mapper
public interface UserMapper {
  UserResponse toResponse(User user);
}
