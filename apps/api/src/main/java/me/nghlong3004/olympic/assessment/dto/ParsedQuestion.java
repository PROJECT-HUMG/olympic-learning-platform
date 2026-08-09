package me.nghlong3004.olympic.assessment.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public record ParsedQuestion(
    String questionNumber,
    JsonNode content,
    JsonNode answer,
    double confidence,
    AssessmentBoundingBox questionBbox,
    List<AssessmentAssetRegion> assetRegions,
    List<String> warnings) {

  public ParsedQuestion {
    content = content == null ? com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode() : content;
    answer = answer == null ? com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode() : answer;
    assetRegions = assetRegions == null ? List.of() : List.copyOf(assetRegions);
    warnings = warnings == null ? List.of() : List.copyOf(warnings);
  }
}
