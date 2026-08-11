package me.nghlong3004.olympic.assessment.mapper;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.assessment.entity.AssessmentImport;
import me.nghlong3004.olympic.assessment.entity.AssessmentQuestionDraft;
import me.nghlong3004.olympic.assessment.entity.AssessmentQuestionDraftAsset;
import me.nghlong3004.olympic.assessment.response.AssessmentImportStatusResponse;
import me.nghlong3004.olympic.assessment.response.AssessmentQuestionDraftResponse;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.question.dto.ImportedQuestion;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AssessmentImportMapper {

  AssessmentImportStatusResponse toStatusResponse(AssessmentImport assessmentImport);

  @Mapping(target = "content", source = "draft.contentJson")
  @Mapping(target = "answer", source = "draft.answerJson")
  @Mapping(target = "warnings", source = "draft.warningsJson")
  @Mapping(target = "sourceBbox", source = "draft.sourceBbox")
  AssessmentQuestionDraftResponse toDraftResponse(
      AssessmentQuestionDraft draft,
      String sourcePageUrl,
      List<AssessmentQuestionDraftResponse.AssessmentDraftAssetResponse> assets);

  @Mapping(target = "id", source = "asset.id")
  @Mapping(target = "role", expression = "java(asset.getRole().name())")
  @Mapping(target = "crop", source = "asset.cropJson")
  AssessmentQuestionDraftResponse.AssessmentDraftAssetResponse toDraftAssetResponse(
      AssessmentQuestionDraftAsset asset, String url);

  @Mapping(target = "sourceDraftId", source = "draft.id")
  @Mapping(target = "subjectId", expression = "java(uuidField(draft, \"subjectId\"))")
  @Mapping(target = "topicId", expression = "java(uuidField(draft, \"topicId\"))")
  @Mapping(target = "type", expression = "java(textField(draft, \"type\"))")
  @Mapping(target = "content", source = "draft.contentJson")
  @Mapping(target = "answer", source = "draft.answerJson")
  @Mapping(target = "explanation", ignore = true)
  @Mapping(target = "difficulty", expression = "java(textField(draft, \"difficulty\"))")
  ImportedQuestion toImportedQuestion(
      AssessmentQuestionDraft draft,
      UUID creatorId,
      List<ImportedQuestion.ImportedQuestionAsset> assets);

  @Mapping(target = "fileId", source = "file.id")
  @Mapping(target = "crop", source = "cropJson")
  ImportedQuestion.ImportedQuestionAsset toImportedAsset(AssessmentQuestionDraftAsset asset);

  default UUID uuidField(AssessmentQuestionDraft draft, String field) {
    try {
      return UUID.fromString(draft.getContentJson().path(field).asText());
    } catch (RuntimeException exception) {
      throw ErrorCode.VALIDATION_ERROR.throwIt(field + " is required");
    }
  }

  default String textField(AssessmentQuestionDraft draft, String field) {
    var value = draft.getContentJson().path(field).asText(null);
    return value == null || value.isBlank() ? null : value.trim();
  }
}
