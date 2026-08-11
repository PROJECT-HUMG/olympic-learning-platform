package me.nghlong3004.olympic.assessment.response;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.assessment.enums.AssessmentDraftStatus;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public record AssessmentQuestionDraftResponse(
    UUID id,
    int ordinal,
    AssessmentDraftStatus status,
    JsonNode content,
    JsonNode answer,
    BigDecimal confidence,
    JsonNode warnings,
    Integer sourcePage,
    JsonNode sourceBbox,
    String sourcePageUrl,
    List<AssessmentDraftAssetResponse> assets) {

  public record AssessmentDraftAssetResponse(
      UUID id, String role, String url, String altText, JsonNode crop) {}
}
