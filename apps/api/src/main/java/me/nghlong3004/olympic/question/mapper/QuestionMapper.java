package me.nghlong3004.olympic.question.mapper;

import java.util.List;
import me.nghlong3004.olympic.question.entity.Question;
import me.nghlong3004.olympic.question.entity.QuestionAsset;
import me.nghlong3004.olympic.question.response.QuestionResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface QuestionMapper {

  @Mapping(target = "subjectId", source = "question.subject.id")
  @Mapping(target = "subjectName", source = "question.subject.name")
  @Mapping(target = "topicId", source = "question.topic.id")
  @Mapping(target = "topicName", source = "question.topic.name")
  @Mapping(target = "content", source = "question.contentJson")
  @Mapping(target = "answer", source = "question.answerJson")
  @Mapping(target = "explanation", source = "question.explanationJson")
  QuestionResponse toResponse(
      Question question, List<QuestionResponse.QuestionAssetResponse> assets);

  @Mapping(target = "id", source = "asset.id")
  @Mapping(target = "role", expression = "java(asset.getRole().name())")
  @Mapping(target = "crop", source = "asset.cropJson")
  QuestionResponse.QuestionAssetResponse toAssetResponse(QuestionAsset asset, String url);
}
