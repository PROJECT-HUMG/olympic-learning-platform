package me.nghlong3004.olympic.exam.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.function.ToIntFunction;
import me.nghlong3004.olympic.exam.dto.ExamFigureDownload;
import me.nghlong3004.olympic.exam.entity.Exam;
import me.nghlong3004.olympic.exam.entity.ExamItem;
import me.nghlong3004.olympic.exam.entity.ExamPaper;
import me.nghlong3004.olympic.exam.entity.ExamPaperFigure;
import me.nghlong3004.olympic.exam.entity.ExamPaperItem;
import me.nghlong3004.olympic.exam.response.*;
import org.springframework.stereotype.Component;

/**
 * Maps drafts and frozen papers into separate staff-plain, staff-solution, and student records.
 * This bean starts no transaction and does not apply release, role, or figure permission.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Component
public class ExamProjections {
  private static final BigDecimal ZERO = new BigDecimal("0.00");

  public ExamDraftResponse draft(Exam exam, List<ExamItem> items) {
    var ordered = ordered(items, ExamItem::getPosition);
    var mapped = new ArrayList<ExamItemResponse>(ordered.size());
    for (var item : ordered) {
      mapped.add(placement(item));
    }
    return new ExamDraftResponse(
        exam.getId(), exam.getCreatedById(), exam.getVersion(), exam.getLatestPublishedVersion(),
        sum(ordered, ExamItem::getPoints), exam.getTitle(), exam.getSubjectId(),
        exam.getInstructions(), exam.getReleaseAt(), List.copyOf(mapped));
  }

  public ExamItemResponse placement(ExamItem item) {
    return new ExamItemResponse(
        item.getQuestionId(), item.getPoints(), weights(item.getPartPoints()), item.getInstructions());
  }

  public JsonNode partPoints(Map<String, BigDecimal> weights) {
    var node = JsonNodeFactory.instance.objectNode();
    if (weights != null) {
      for (var entry : weights.entrySet()) {
        if (entry.getKey() != null && entry.getValue() != null) {
          node.set(entry.getKey(), JsonNodeFactory.instance.numberNode(entry.getValue()));
        }
      }
    }
    return node;
  }

  public Map<String, BigDecimal> weights(JsonNode partPoints) {
    var ordered = new LinkedHashMap<String, BigDecimal>();
    if (partPoints != null && partPoints.isObject()) {
      var names = partPoints.fieldNames();
      while (names.hasNext()) {
        var name = names.next();
        var value = partPoints.get(name);
        if (value != null && value.isNumber()) {
          var decimal = value.decimalValue();
          ordered.put(name, decimal.scale() < 2 ? decimal.setScale(2) : decimal);
        }
      }
    }
    return Collections.unmodifiableMap(ordered);
  }

  public JsonNode copy(JsonNode node) {
    if (node == null || node.isNull()) {
      return JsonNodeFactory.instance.objectNode();
    }
    return node.deepCopy();
  }

  public Set<UUID> assetIds(JsonNode node) {
    var ids = new LinkedHashSet<UUID>();
    collect(node, ids);
    return Collections.unmodifiableSet(ids);
  }

  public boolean referenced(UUID assetId, JsonNode content, JsonNode explanation) {
    return assetId != null
        && (assetIds(content).contains(assetId) || assetIds(explanation).contains(assetId));
  }

  public boolean solutionOnly(UUID assetId, JsonNode content, JsonNode explanation) {
    return assetId != null
        && assetIds(explanation).contains(assetId) && !assetIds(content).contains(assetId);
  }

  public StaffExamItemResponse staffItem(ExamItem item, JsonNode content) {
    return new StaffExamItemResponse(
        item.getQuestionId(), item.getPoints(), weights(item.getPartPoints()),
        item.getInstructions(), copy(content));
  }

  public StaffExamSolutionItemResponse solutionItem(
      ExamItem item, JsonNode content, JsonNode answer, JsonNode explanation) {
    return new StaffExamSolutionItemResponse(
        item.getQuestionId(), item.getPoints(), weights(item.getPartPoints()), item.getInstructions(),
        copy(content), copy(answer), copy(explanation));
  }

  public StaffExamPaperResponse staffPreview(Exam exam, List<StaffExamItemResponse> items) {
    return new StaffExamPaperResponse(
        null, exam.getId(), null, exam.getTitle(), exam.getSubjectId(), exam.getInstructions(),
        exam.getReleaseAt(), null, sum(items, StaffExamItemResponse::points), copyList(items));
  }

  public StaffExamSolutionResponse solutionPreview(
      Exam exam, List<StaffExamSolutionItemResponse> items) {
    return new StaffExamSolutionResponse(
        null, exam.getId(), null, exam.getTitle(), exam.getSubjectId(), exam.getInstructions(),
        exam.getReleaseAt(), null, sum(items, StaffExamSolutionItemResponse::points), copyList(items));
  }

  public StaffExamPaperResponse staffPaper(ExamPaper paper, List<ExamPaperItem> items) {
    var mapped = new ArrayList<StaffExamItemResponse>();
    for (var item : ordered(items, ExamPaperItem::getPosition)) {
      mapped.add(new StaffExamItemResponse(
          item.getQuestionId(), item.getPoints(), weights(item.getPartPoints()),
          item.getInstructions(), copy(item.getContentJson())));
    }
    return new StaffExamPaperResponse(
        paper.getId(), paper.getExamId(), paper.getVersionNumber(), paper.getTitle(),
        paper.getSubjectId(), paper.getInstructions(), paper.getReleaseAt(),
        paper.getPublishedAt(), paper.getTotalPoints(), List.copyOf(mapped));
  }

  public StaffExamSolutionResponse solutionPaper(ExamPaper paper, List<ExamPaperItem> items) {
    var mapped = new ArrayList<StaffExamSolutionItemResponse>();
    for (var item : ordered(items, ExamPaperItem::getPosition)) {
      mapped.add(new StaffExamSolutionItemResponse(
          item.getQuestionId(), item.getPoints(), weights(item.getPartPoints()),
          item.getInstructions(), copy(item.getContentJson()),
          copy(item.getAnswerJson()), copy(item.getExplanationJson())));
    }
    return new StaffExamSolutionResponse(
        paper.getId(), paper.getExamId(), paper.getVersionNumber(), paper.getTitle(),
        paper.getSubjectId(), paper.getInstructions(), paper.getReleaseAt(),
        paper.getPublishedAt(), paper.getTotalPoints(), List.copyOf(mapped));
  }

  public StudentExamPaperResponse studentPaper(ExamPaper paper, List<ExamPaperItem> items) {
    var mapped = new ArrayList<StudentExamItemResponse>();
    for (var item : ordered(items, ExamPaperItem::getPosition)) {
      mapped.add(new StudentExamItemResponse(
          item.getQuestionId(), item.getPoints(), weights(item.getPartPoints()),
          item.getInstructions(), copy(item.getContentJson())));
    }
    return new StudentExamPaperResponse(
        paper.getId(), paper.getExamId(), paper.getVersionNumber(), paper.getTitle(),
        paper.getSubjectId(), paper.getInstructions(), paper.getReleaseAt(),
        paper.getPublishedAt(), paper.getTotalPoints(), List.copyOf(mapped));
  }

  public ExamPaperSummaryResponse summary(ExamPaper paper) {
    return new ExamPaperSummaryResponse(
        paper.getId(), paper.getExamId(), paper.getVersionNumber(), paper.getTitle(),
        paper.getSubjectId(), paper.getReleaseAt(), paper.getPublishedAt(), paper.getTotalPoints());
  }

  public ExamFigureDownload download(ExamPaperFigure figure) {
    var bytes = figure.getContent();
    return new ExamFigureDownload(
        figure.getOriginalName(), figure.getContentType(), bytes == null ? new byte[0] : bytes.clone());
  }

  private static <T> BigDecimal sum(List<T> items, Function<T, BigDecimal> points) {
    var total = ZERO;
    if (items != null) {
      for (var item : items) {
        if (item != null) {
          var value = points.apply(item);
          if (value != null) {
            total = total.add(value);
          }
        }
      }
    }
    return total;
  }

  private static <T> List<T> copyList(List<T> items) {
    if (items == null || items.isEmpty()) {
      return List.of();
    }
    var copy = new ArrayList<T>(items.size());
    for (var item : items) {
      if (item != null) {
        copy.add(item);
      }
    }
    return List.copyOf(copy);
  }

  private static <T> List<T> ordered(List<T> items, ToIntFunction<T> position) {
    var ordered = new ArrayList<T>();
    if (items != null) {
      for (var item : items) {
        if (item != null) {
          ordered.add(item);
        }
      }
    }
    ordered.sort(Comparator.comparingInt(position));
    return ordered;
  }

  private static void collect(JsonNode node, Set<UUID> ids) {
    if (node == null || node.isNull()) {
      return;
    }
    if (node.isObject()) {
      var assetId = node.get("assetId");
      if (assetId != null && assetId.isTextual()) {
        try {
          ids.add(UUID.fromString(assetId.asText()));
        } catch (IllegalArgumentException ignored) {
          // Non-UUID text is not a private figure id.
        }
      }
      node.forEach(child -> collect(child, ids));
    } else if (node.isArray()) {
      node.forEach(child -> collect(child, ids));
    }
  }
}
