package me.nghlong3004.olympic.question.response;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.question.enums.QuestionStatus;

/** @author nghlong3004 (Long Nguyen Hoang) @since 8/10/2026 */
public record QuestionResponse(UUID id, UUID subjectId, String subjectName, UUID topicId, String topicName,
    QuestionStatus status, String type, JsonNode content, JsonNode answer, JsonNode explanation,
    String difficulty, OffsetDateTime publishedAt, OffsetDateTime archivedAt, List<QuestionAssetResponse> assets) {
  public record QuestionAssetResponse(UUID id, String role, String url, String altText, JsonNode crop) {}
}
