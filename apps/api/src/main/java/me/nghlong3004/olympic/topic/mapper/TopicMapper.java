package me.nghlong3004.olympic.topic.mapper;

import me.nghlong3004.olympic.topic.entity.Topic;
import me.nghlong3004.olympic.topic.request.CreateTopicRequest;
import me.nghlong3004.olympic.topic.response.TopicResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface TopicMapper {

  @Mapping(target = "subjectId", source = "subject.id")
  TopicResponse toResponse(Topic topic);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "subject", ignore = true)
  @Mapping(target = "slug", ignore = true)
  @Mapping(target = "enabled", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  Topic toEntity(CreateTopicRequest request);
}
