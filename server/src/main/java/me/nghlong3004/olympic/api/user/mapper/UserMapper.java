package me.nghlong3004.olympic.api.user.mapper;

import me.nghlong3004.olympic.api.user.dto.UserResponse;
import me.nghlong3004.olympic.api.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct mapper for converting between {@link User} entity and DTOs.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(source = "publicId", target = "id")
    @Mapping(source = "role.name", target = "role")
    UserResponse toResponse(User user);
}
