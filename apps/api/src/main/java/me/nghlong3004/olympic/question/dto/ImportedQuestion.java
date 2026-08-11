package me.nghlong3004.olympic.question.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.question.enums.QuestionAssetRole;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public record ImportedQuestion(
    UUID sourceDraftId,
    UUID subjectId,
    UUID topicId,
    UUID creatorId,
    String type,
    JsonNode content,
    JsonNode answer,
    JsonNode explanation,
    String difficulty,
    List<ImportedQuestionAsset> assets) {

  public ImportedQuestion {
    assets = assets == null ? List.of() : List.copyOf(assets);
  }

  public record ImportedQuestionAsset(
      UUID fileId,
      QuestionAssetRole role,
      int sortOrder,
      String altText,
      JsonNode crop) {}
}
