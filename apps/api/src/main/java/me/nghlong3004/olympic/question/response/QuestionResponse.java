package me.nghlong3004.olympic.question.response;

import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.question.enums.QuestionStatus;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public record QuestionResponse(
    @Schema(description = "Question identifier") UUID id,
    @Schema(description = "Subject identifier") UUID subjectId,
    @Schema(example = "Mathematics") String subjectName,
    @Schema(description = "Topic identifier") UUID topicId,
    @Schema(example = "Combinatorics") String topicName,
    @Schema(example = "DRAFT") QuestionStatus status,
    @Schema(example = "multiple_choice") String type,
    @Schema(description = "Structured question content") JsonNode content,
    @Schema(description = "Structured answer payload") JsonNode answer,
    @Schema(description = "Structured answer explanation") JsonNode explanation,
    @Schema(example = "MEDIUM") String difficulty,
    @Schema(description = "Publication timestamp") OffsetDateTime publishedAt,
    @Schema(description = "Archive timestamp") OffsetDateTime archivedAt,
    @Schema(description = "Question assets") List<QuestionAssetResponse> assets) {
  public record QuestionAssetResponse(
      @Schema(description = "Asset identifier") UUID id,
      @Schema(example = "QUESTION_IMAGE") String role,
      @Schema(description = "Download URL") String url,
      @Schema(description = "Accessible alternative text") String altText,
      @Schema(description = "Crop metadata") JsonNode crop) {}
}
