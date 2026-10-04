package me.nghlong3004.olympic.exam.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.exam.ExamLimits;
import org.springframework.stereotype.Component;

/**
 * Exam-only placement bounds. Duplicate question ids are separate placements.
 * Returned points are not written onto bank questions.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Component
public class ExamPlacementPolicy {
  private static final BigDecimal MAX_POINTS = new BigDecimal(ExamLimits.MAX_ITEM_POINTS);

  public String title(String title, boolean publish) {
    var value = title == null ? "" : title;
    if (value.length() > ExamLimits.MAX_TITLE) {
      fail("Exam title is too long");
    }
    if (publish && value.isBlank()) {
      fail("Exam title is required");
    }
    return value;
  }

  public String instructions(String instructions) {
    var value = instructions == null ? "" : instructions;
    if (value.length() > ExamLimits.MAX_INSTRUCTIONS) {
      fail("Instructions are too long");
    }
    return value;
  }

  public void requireRelease(OffsetDateTime releaseAt) {
    if (releaseAt == null) {
      fail("Exam release time is required");
    }
  }

  public void requireItems(List<?> items, boolean publish) {
    if (items == null || items.stream().anyMatch(Objects::isNull)) {
      fail("Exam items are required");
    }
    if (items.size() > ExamLimits.MAX_PLACEMENTS) {
      fail("An exam can contain at most 100 items");
    }
    if (publish && items.isEmpty()) {
      fail("Exam items are required");
    }
  }

  public BigDecimal requirePoints(BigDecimal points) {
    if (points == null) {
      fail("Points are required");
    }
    if (points.scale() > 2) {
      fail("Points support at most two decimal places");
    }
    var normalized = points.setScale(2);
    if (normalized.signum() <= 0 || normalized.compareTo(MAX_POINTS) > 0) {
      fail("Points must be positive and at most 1000");
    }
    return normalized;
  }

  public Map<String, BigDecimal> requireWeights(
      JsonNode content, BigDecimal points, Map<String, BigDecimal> partPoints) {
    var itemPoints = requirePoints(points);
    if (partPoints == null || hasNullWeight(partPoints)) {
      fail(partPoints == null ? "Part points are required" : "Points are required");
    }
    if (!multipart(content) && partPoints.isEmpty()) {
      return Map.of();
    }
    var partIds = partIds(content);
    if (!partPoints.keySet().equals(partIds)) {
      fail("Part points must use the question part ids");
    }
    var normalized = new LinkedHashMap<String, BigDecimal>();
    var sum = BigDecimal.ZERO.setScale(2);
    for (var partId : partIds) {
      var part = requirePoints(partPoints.get(partId));
      normalized.put(partId, part);
      sum = sum.add(part);
    }
    if (sum.compareTo(itemPoints) != 0) {
      fail("Part points must sum to the item points");
    }
    return Collections.unmodifiableMap(normalized);
  }

  private static boolean hasNullWeight(Map<String, BigDecimal> partPoints) {
    for (var value : partPoints.values()) {
      if (value == null) {
        return true;
      }
    }
    return false;
  }

  private static boolean multipart(JsonNode content) {
    return content != null && "MULTIPART".equals(content.path("structure").asText());
  }

  private static Set<String> partIds(JsonNode content) {
    var ids = new LinkedHashSet<String>();
    var parts = content == null ? null : content.get("parts");
    if (parts == null || !parts.isArray()) {
      return ids;
    }
    for (var part : parts) {
      var id = part.get("id");
      if (id != null && id.isTextual()) {
        ids.add(id.asText());
      }
    }
    return ids;
  }

  private static void fail(String detail) {
    throw ErrorCode.VALIDATION_ERROR.throwIt(detail);
  }
}
