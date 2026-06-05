package me.nghlong3004.olympic.api.learning.mapper;

import me.nghlong3004.olympic.api.learning.dto.SubjectResponse;
import me.nghlong3004.olympic.api.learning.entity.Subject;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct mapper for {@link Subject} entity and DTOs.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Mapper(componentModel = "spring")
public interface SubjectMapper {

    @Mapping(source = "publicId", target = "id")
    SubjectResponse toResponse(Subject subject);
}
