package me.nghlong3004.olympic.question.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import me.nghlong3004.olympic.common.error.ErrorCode;
import org.springframework.stereotype.Component;

/**
 * schemaVersion 1 checks for manual authoring. Legacy import validation does not call this type.
 * Part responseType remains SINGLE_CHOICE, MULTIPLE_CHOICE, or WRITTEN. written_multipart is WRITTEN-only.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Component
public class QuestionManualContentValidator {
  public static final int MAX_TITLE = 300;
  public static final int MAX_SOURCE = 16_000;
  public static final int MAX_ALT = 500;
  public static final int MAX_CAPTION = 500;
  public static final int MAX_RUBRIC = 4_000;
  public static final int MAX_BLOCKS = 40;
  public static final int MAX_PARTS = 20;
  public static final int MAX_OPTIONS = 12;
  public static final int MAX_FIGURES_PER_GROUP = 2;

  private static final Pattern SAFE_ID = Pattern.compile("^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$");
  private static final Set<String> CONTENT_FIELDS = Set.of("schemaVersion", "title", "structure", "stem", "parts");
  private static final Set<String> TEXT_FIELDS = Set.of("id", "kind", "source");
  private static final Set<String> MATH_FIELDS = Set.of("id", "kind", "source", "display");
  private static final Set<String> GROUP_FIELDS = Set.of("id", "kind", "layout", "figures");
  private static final Set<String> FIGURE_FIELDS = Set.of("assetId", "alt", "caption");
  private static final Set<String> PART_FIELDS = Set.of("id", "responseType", "prompt", "options");
  private static final Set<String> OPTION_FIELDS = Set.of("id", "content");
  private static final Set<String> ANSWER_FIELDS = Set.of("parts");
  private static final Set<String> ANSWER_PART_FIELDS = Set.of("partId", "correctOptionIds");
  private static final Set<String> EXPLANATION_FIELDS = Set.of("parts");
  private static final Set<String> SOLUTION_FIELDS = Set.of("partId", "solution", "rubric");
  private static final Set<String> TYPES = Set.of("single_choice", "multiple_choice", "written", "written_multipart");

  public JsonNode normalizeNew(JsonNode content) {
    if (content == null || !content.isObject()) {
      fail("Question content must be an object");
    }
    ObjectNode copy = content.deepCopy();
    JsonNode version = copy.get("schemaVersion");
    if (version == null || version.isNull()) {
      copy.put("schemaVersion", 1);
    } else if (!isVersionOne(version)) {
      fail("Unsupported question schema version");
    }
    return copy;
  }

  public void requireDraft(
      String type, JsonNode content, JsonNode answer, JsonNode explanation, Set<UUID> figureIds) {
    check(type, content, answer, explanation, figureIds, false);
  }

  public void requirePublishable(
      String type, JsonNode content, JsonNode answer, JsonNode explanation, Set<UUID> figureIds) {
    check(type, content, answer, explanation, figureIds, true);
  }

  private void check(
      String type,
      JsonNode content,
      JsonNode answer,
      JsonNode explanation,
      Set<UUID> figureIds,
      boolean publish) {
    if (type == null || !TYPES.contains(type)) {
      fail("Question type is not supported");
    }
    if (content == null || !content.isObject() || !isVersionOne(content.get("schemaVersion"))) {
      fail("Unsupported question schema version");
    }
    requireFields(content, CONTENT_FIELDS, "content");
    if (content.has("title")) {
      requireText(content.get("title"), MAX_TITLE, "Title");
    } else if (publish) {
      fail("Question title is required");
    }
    if (content.has("structure")) {
      requireExact(content.get("structure"), structureFor(type), "Question structure");
    } else if (publish) {
      fail("Question structure is required");
    }
    Set<UUID> refs = new HashSet<>();
    if (content.has("stem")) {
      requireBlocks(content.get("stem"), refs, publish);
    } else if (publish) {
      fail("Question stem is required");
    }
    Set<String> partIds = Set.of();
    if (content.has("parts")) {
      partIds = requireParts(type, content.get("parts"), refs, publish);
    } else if (publish) {
      fail("Question parts are required");
    }
    requireAnswer(answer);
    requireExplanation(explanation, refs, publish);
    if (figureIds == null || !figureIds.containsAll(refs)) {
      fail("Figure does not belong to this question");
    }
    if (publish) {
      requireKnownPartRefs(answer, partIds, "Answer");
      requireKnownPartRefs(explanation, partIds, "Explanation");
      requirePublishableShape(type, content, answer);
    }
  }

  private void requirePublishableShape(String type, JsonNode content, JsonNode answer) {
    if (content.path("title").asText().trim().isEmpty()) {
      fail("Question title is required");
    }
    JsonNode parts = content.get("parts");
    for (JsonNode part : parts) {
      if (!part.has("prompt") || !part.get("prompt").isArray()) {
        fail("Part prompt is required");
      }
      if (!part.has("options") || !part.get("options").isArray()) {
        fail("Part options are required");
      }
    }
    if ("written_multipart".equals(type)) {
      if (parts.size() < 2) {
        fail("A multipart question needs at least two parts");
      }
      for (JsonNode part : parts) {
        if (!meaningful(part.get("prompt"))) {
          fail("Each part prompt is required");
        }
        requireWritten(part, answer);
      }
      return;
    }
    if (parts.size() != 1) {
      fail("This question form needs exactly one part");
    }
    JsonNode part = parts.get(0);
    if (!meaningful(content.get("stem")) && !meaningful(part.get("prompt"))) {
      fail("Question stem or prompt is required");
    }
    if ("written".equals(type)) {
      requireWritten(part, answer);
    } else {
      requireChoices(part, answer, "single_choice".equals(type));
    }
  }

  private Set<String> requireParts(String type, JsonNode parts, Set<UUID> refs, boolean publish) {
    if (!parts.isArray() || parts.size() > MAX_PARTS) {
      fail("Question parts are invalid");
    }
    int partLimit = "written_multipart".equals(type) ? MAX_PARTS : 1;
    if (parts.size() > partLimit) {
      fail("This question form has too many parts");
    }
    Set<String> ids = new HashSet<>();
    for (JsonNode part : parts) {
      requireFields(part, PART_FIELDS, "part");
      requireId(part.get("id"), ids, "Part id");
      if (part.has("responseType")) {
        requireExact(part.get("responseType"), responseFor(type), "Part responseType");
      } else if (publish) {
        fail("Part responseType is required");
      }
      if (part.has("prompt")) {
        requireBlocks(part.get("prompt"), refs, publish);
      }
      if (part.has("options")) {
        boolean written = part.has("responseType") && "WRITTEN".equals(responseFor(type));
        requireOptions(part.get("options"), refs, written, publish);
      }
    }
    return ids;
  }

  private void requireOptions(JsonNode options, Set<UUID> refs, boolean written, boolean publish) {
    if (!options.isArray() || options.size() > MAX_OPTIONS || (written && !options.isEmpty())) {
      fail("Question options are invalid");
    }
    Set<String> ids = new HashSet<>();
    for (JsonNode option : options) {
      requireFields(option, OPTION_FIELDS, "option");
      requireId(option.get("id"), ids, "Option id");
      requireBlocks(option.get("content"), refs, publish);
    }
  }

  private void requireBlocks(JsonNode blocks, Set<UUID> refs, boolean publish) {
    if (blocks == null || !blocks.isArray() || blocks.size() > MAX_BLOCKS) {
      fail("Question blocks are invalid");
    }
    Set<String> ids = new HashSet<>();
    for (JsonNode block : blocks) {
      if (block == null || !block.isObject()) {
        fail("Question block must be an object");
      }
      String kind = block.path("kind").asText();
      if ("text".equals(kind)) {
        requireFields(block, TEXT_FIELDS, "text block");
        requireId(block.get("id"), ids, "Block id");
        requireText(block.get("source"), MAX_SOURCE, "Text source");
      } else if ("math".equals(kind)) {
        requireFields(block, MATH_FIELDS, "math block");
        requireId(block.get("id"), ids, "Block id");
        requireText(block.get("source"), MAX_SOURCE, "Math source");
        if (!block.has("display") || !block.get("display").isBoolean()) {
          fail("Math display must be true or false");
        }
      } else if ("figure_group".equals(kind)) {
        requireFields(block, GROUP_FIELDS, "figure group");
        requireId(block.get("id"), ids, "Block id");
        JsonNode layout = block.get("layout");
        if (layout == null
            || !("full_width".equals(layout.asText()) || "side_by_side".equals(layout.asText()))) {
          fail("Figure layout is invalid");
        }
        JsonNode figures = block.get("figures");
        if (figures == null || !figures.isArray() || figures.size() > MAX_FIGURES_PER_GROUP) {
          fail("Figure group is invalid");
        }
        if (publish && figures.isEmpty()) {
          fail("Figure group must contain a figure");
        }
        for (JsonNode figure : figures) {
          requireFields(figure, FIGURE_FIELDS, "figure");
          refs.add(assetId(figure.get("assetId")));
          String alt = requireText(figure.get("alt"), MAX_ALT, "Figure alt");
          requireText(figure.get("caption"), MAX_CAPTION, "Figure caption");
          if (publish && alt.trim().isEmpty()) {
            fail("Figure alt is required");
          }
        }
      } else {
        fail("Unknown question block");
      }
    }
  }

  private void requireAnswer(JsonNode answer) {
    if (answer == null || answer.isNull()) {
      return;
    }
    requireFields(answer, ANSWER_FIELDS, "answer");
    JsonNode parts = answer.get("parts");
    if (parts == null) {
      return;
    }
    if (!parts.isArray() || parts.size() > MAX_PARTS) {
      fail("Answer parts are invalid");
    }
    Set<String> ids = new HashSet<>();
    for (JsonNode part : parts) {
      requireFields(part, ANSWER_PART_FIELDS, "answer part");
      requireId(part.get("partId"), ids, "Answer partId");
      JsonNode selected = part.get("correctOptionIds");
      if (selected == null) {
        continue;
      }
      if (!selected.isArray() || selected.size() > MAX_OPTIONS) {
        fail("Correct options are invalid");
      }
      Set<String> unique = new HashSet<>();
      for (JsonNode id : selected) {
        if (!id.isTextual() || !SAFE_ID.matcher(id.asText()).matches() || !unique.add(id.asText())) {
          fail("Correct options must be distinct ids");
        }
      }
    }
  }

  private void requireExplanation(JsonNode explanation, Set<UUID> refs, boolean publish) {
    if (explanation == null || explanation.isNull()) {
      return;
    }
    requireFields(explanation, EXPLANATION_FIELDS, "explanation");
    JsonNode parts = explanation.get("parts");
    if (parts == null) {
      return;
    }
    if (!parts.isArray() || parts.size() > MAX_PARTS) {
      fail("Explanation parts are invalid");
    }
    Set<String> ids = new HashSet<>();
    for (JsonNode part : parts) {
      requireFields(part, SOLUTION_FIELDS, "explanation part");
      requireId(part.get("partId"), ids, "Explanation partId");
      if (part.has("solution")) {
        requireBlocks(part.get("solution"), refs, publish);
      }
      if (part.has("rubric")) {
        requireText(part.get("rubric"), MAX_RUBRIC, "Rubric");
      }
    }
  }

  private static void requireKnownPartRefs(JsonNode node, Set<String> partIds, String label) {
    if (node == null || node.isNull() || !node.has("parts")) {
      return;
    }
    for (JsonNode part : node.get("parts")) {
      if (!partIds.contains(part.path("partId").asText())) {
        fail(label + " part does not belong to this question");
      }
    }
  }

  private void requireChoices(JsonNode part, JsonNode answer, boolean single) {
    JsonNode options = part.get("options");
    if (options == null || options.size() < 2) {
      fail("A choice question needs at least two options");
    }
    Set<String> optionIds = new HashSet<>();
    for (JsonNode option : options) {
      if (!meaningful(option.get("content"))) {
        fail("Choice options must be nonempty");
      }
      optionIds.add(option.get("id").asText());
    }
    JsonNode selected = selections(answer, part.get("id").asText());
    if (selected == null || (single && selected.size() != 1) || (!single && selected.isEmpty())) {
      fail("Correct options are invalid");
    }
    Set<String> unique = new HashSet<>();
    for (JsonNode id : selected) {
      if (!id.isTextual() || !unique.add(id.asText()) || !optionIds.contains(id.asText())) {
        fail("Correct options must identify distinct options");
      }
    }
  }

  private void requireWritten(JsonNode part, JsonNode answer) {
    JsonNode options = part.get("options");
    if (options == null || !options.isEmpty()) {
      fail("Written parts cannot contain options");
    }
    JsonNode selected = selections(answer, part.get("id").asText());
    if (selected != null && !selected.isEmpty()) {
      fail("Written parts cannot contain selections");
    }
  }

  private static JsonNode selections(JsonNode answer, String partId) {
    if (answer == null || !answer.has("parts")) {
      return null;
    }
    for (JsonNode part : answer.get("parts")) {
      if (partId.equals(part.path("partId").asText())) {
        return part.get("correctOptionIds");
      }
    }
    return null;
  }

  private static boolean meaningful(JsonNode blocks) {
    if (blocks == null || !blocks.isArray()) {
      return false;
    }
    for (JsonNode block : blocks) {
      String kind = block.path("kind").asText();
      if (("text".equals(kind) || "math".equals(kind)) && !block.path("source").asText().trim().isEmpty()) {
        return true;
      }
      if ("figure_group".equals(kind) && block.path("figures").size() > 0) {
        return true;
      }
    }
    return false;
  }

  private static String structureFor(String type) {
    return "written_multipart".equals(type) ? "MULTIPART" : "SINGLE";
  }

  private static String responseFor(String type) {
    return switch (type) {
      case "single_choice" -> "SINGLE_CHOICE";
      case "multiple_choice" -> "MULTIPLE_CHOICE";
      case "written", "written_multipart" -> "WRITTEN";
      default -> "";
    };
  }

  private static UUID assetId(JsonNode node) {
    if (node == null || !node.isTextual()) {
      fail("Figure assetId is invalid");
    }
    try {
      return UUID.fromString(node.asText());
    } catch (IllegalArgumentException exception) {
      fail("Figure assetId is invalid");
      return null;
    }
  }

  private static void requireId(JsonNode node, Set<String> ids, String label) {
    if (node == null || !node.isTextual() || !SAFE_ID.matcher(node.asText()).matches() || !ids.add(node.asText())) {
      fail(label + " is invalid");
    }
  }

  private static void requireExact(JsonNode node, String expected, String label) {
    if (node == null || !node.isTextual() || !expected.equals(node.asText())) {
      fail(label + " is invalid");
    }
  }

  private static String requireText(JsonNode node, int max, String label) {
    if (node == null || node.isNull() || !node.isTextual() || node.asText().length() > max
        || node.asText().chars().anyMatch(QuestionManualContentValidator::forbidden)) {
      fail(label + " is invalid");
    }
    return node.asText();
  }

  private static boolean forbidden(int codePoint) {
    return Character.isISOControl(codePoint) && codePoint != '\n' && codePoint != '\r' && codePoint != '\t';
  }

  private static void requireFields(JsonNode node, Set<String> allowed, String label) {
    if (node == null || !node.isObject()) {
      fail(label + " must be an object");
    }
    var names = node.fieldNames();
    while (names.hasNext()) {
      if (!allowed.contains(names.next())) {
        fail("Unsupported " + label + " field");
      }
    }
  }

  private static boolean isVersionOne(JsonNode version) {
    return version != null
        && version.isNumber()
        && !version.isFloatingPointNumber()
        && version.canConvertToLong()
        && version.longValue() == 1L;
  }

  private static void fail(String detail) {
    throw ErrorCode.VALIDATION_ERROR.throwIt(detail);
  }
}
