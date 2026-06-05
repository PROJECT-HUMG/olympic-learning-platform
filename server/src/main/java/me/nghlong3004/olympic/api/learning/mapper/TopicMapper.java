package me.nghlong3004.olympic.api.learning.mapper;

import me.nghlong3004.olympic.api.learning.dto.TopicResponse;
import me.nghlong3004.olympic.api.learning.entity.Topic;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct mapper for {@link Topic} entity and DTOs.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Mapper(componentModel = "spring")
public interface TopicMapper {

    @Mapping(source = "publicId", target = "id")
    @Mapping(source = "subject.publicId", target = "subjectId")
    @Mapping(source = "parent.publicId", target = "parentId")
    TopicResponse toResponse(Topic topic);
}
