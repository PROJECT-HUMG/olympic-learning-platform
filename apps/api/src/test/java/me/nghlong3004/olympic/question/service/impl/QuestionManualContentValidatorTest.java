package me.nghlong3004.olympic.question.service.impl;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Set;
import java.util.UUID;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import org.junit.jupiter.api.Test;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
class QuestionManualContentValidatorTest {
  private final QuestionManualContentValidator validator = new QuestionManualContentValidator();
  private final ObjectMapper mapper = new ObjectMapper();
  private final UUID figureId = UUID.fromString("00000000-0000-0000-0000-000000000211");

  @Test
  void draftAllowsIncompleteShapeAndRejectsUnsafeSource() throws Exception {
    JsonNode normalized = validator.normalizeNew(mapper.readTree(
        "{\"title\":\"\",\"structure\":\"SINGLE\",\"stem\":[{\"id\":\"s\",\"kind\":\"text\",\"source\":\"\"}],\"parts\":[]}"));
    assertThatCode(() -> validator.requireDraft("written", normalized, mapper.readTree("{\"parts\":[]}"), null, Set.of()))
        .doesNotThrowAnyException();
    ObjectNode nullSource = (ObjectNode) normalized.deepCopy();
    ((ObjectNode) nullSource.withArray("stem").get(0)).putNull("source");
    assertThatThrownBy(() -> validator.requireDraft("written", nullSource, mapper.createObjectNode(), null, Set.of()))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.VALIDATION_ERROR);
    ObjectNode unknown = (ObjectNode) normalized.deepCopy();
    unknown.put("schemaVersion", 2);
    assertThatThrownBy(() -> validator.requireDraft("written", unknown, mapper.createObjectNode(), null, Set.of()))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void draftRejectsOversizedSourceTooManyFiguresAndForeignRefs() throws Exception {
    ObjectNode oversized = (ObjectNode) mapper.readTree(
        "{\"schemaVersion\":1,\"structure\":\"SINGLE\",\"stem\":[{\"id\":\"s\",\"kind\":\"text\",\"source\":\"\"}],\"parts\":[]}");
    ((ObjectNode) oversized.withArray("stem").get(0)).put("source", "x".repeat(QuestionManualContentValidator.MAX_SOURCE + 1));
    assertThatThrownBy(() -> validator.requireDraft("written", oversized, mapper.createObjectNode(), null, Set.of()))
        .isInstanceOf(ApiException.class);
    JsonNode three = mapper.readTree("""
        {"schemaVersion":1,"structure":"SINGLE","stem":[{"id":"g","kind":"figure_group","layout":"side_by_side","figures":[
          {"assetId":"00000000-0000-0000-0000-000000000211","alt":"","caption":""},
          {"assetId":"00000000-0000-0000-0000-000000000211","alt":"","caption":""},
          {"assetId":"00000000-0000-0000-0000-000000000211","alt":"","caption":""}
        ]}],"parts":[]}
        """);
    assertThatThrownBy(() -> validator.requireDraft("written", three, mapper.createObjectNode(), null, Set.of(figureId)))
        .isInstanceOf(ApiException.class);
    JsonNode foreign = mapper.readTree("""
        {"schemaVersion":1,"structure":"SINGLE","stem":[{"id":"g","kind":"figure_group","layout":"full_width","figures":[
          {"assetId":"00000000-0000-0000-0000-000000000099","alt":"","caption":""}]}],"parts":[]}
        """);
    assertThatThrownBy(() -> validator.requireDraft("written", foreign, mapper.createObjectNode(), null, Set.of(figureId)))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void publishRejectsEmptyFigureGroupBlankAltAndMissingPrompt() throws Exception {
    JsonNode emptyGroup = mapper.readTree("""
        {"schemaVersion":1,"title":"Draw","structure":"SINGLE",
         "stem":[{"id":"g","kind":"figure_group","layout":"full_width","figures":[]}],
         "parts":[{"id":"p","responseType":"WRITTEN","prompt":[{"id":"q","kind":"text","source":"Explain"}],"options":[]}]}
        """);
    assertThatThrownBy(() -> validator.requirePublishable("written", emptyGroup, mapper.createObjectNode(), null, Set.of()))
        .isInstanceOf(ApiException.class);
    JsonNode blankAlt = mapper.readTree("""
        {"schemaVersion":1,"title":"Draw","structure":"SINGLE",
         "stem":[{"id":"g","kind":"figure_group","layout":"full_width","figures":[
           {"assetId":"00000000-0000-0000-0000-000000000211","alt":" ","caption":""}]}],
         "parts":[{"id":"p","responseType":"WRITTEN","prompt":[{"id":"q","kind":"text","source":"Explain"}],"options":[]}]}
        """);
    assertThatThrownBy(() -> validator.requirePublishable("written", blankAlt, mapper.createObjectNode(), null, Set.of(figureId)))
        .isInstanceOf(ApiException.class);
    JsonNode missingPrompt = mapper.readTree("""
        {"schemaVersion":1,"title":"Prove","structure":"SINGLE","stem":[{"id":"s","kind":"text","source":"Shared"}],
         "parts":[{"id":"p","responseType":"WRITTEN","options":[]}]}
        """);
    assertThatThrownBy(() -> validator.requirePublishable("written", missingPrompt, mapper.createObjectNode(), null, Set.of()))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void publishChoiceWrittenAndMultipartRules() throws Exception {
    assertThatThrownBy(() -> validator.requirePublishable(
            "single_choice", choice("SINGLE_CHOICE", 1), answer("[\"a\"]", "p"), null, Set.of()))
        .isInstanceOf(ApiException.class);
    assertThatCode(() -> validator.requirePublishable(
            "single_choice", choice("SINGLE_CHOICE", 2), answer("[\"a\"]", "p"), mapper.createObjectNode(), Set.of()))
        .doesNotThrowAnyException();
    assertThatCode(() -> validator.requirePublishable(
            "multiple_choice", choice("MULTIPLE_CHOICE", 2), answer("[\"a\",\"b\"]", "p"), null, Set.of()))
        .doesNotThrowAnyException();
    JsonNode written = mapper.readTree("""
        {"schemaVersion":1,"title":"Prove","structure":"SINGLE","stem":[{"id":"s","kind":"text","source":"Show it"}],
         "parts":[{"id":"p","responseType":"WRITTEN","prompt":[],"options":[]}]}
        """);
    assertThatCode(() -> validator.requirePublishable("written", written, mapper.readTree("{\"parts\":[]}"), null, Set.of()))
        .doesNotThrowAnyException();
    JsonNode mixed = mapper.readTree("""
        {"schemaVersion":1,"title":"Paper","structure":"MULTIPART","stem":[{"id":"s","kind":"text","source":"Shared"}],
         "parts":[
           {"id":"p1","responseType":"WRITTEN","prompt":[],"options":[]},
           {"id":"p2","responseType":"WRITTEN","prompt":[],"options":[]}
         ]}
        """);
    assertThatThrownBy(() -> validator.requirePublishable("written_multipart", mixed, mapper.createObjectNode(), null, Set.of()))
        .isInstanceOf(ApiException.class);
    JsonNode prompts = mapper.readTree("""
        {"schemaVersion":1,"title":"Paper","structure":"MULTIPART","stem":[{"id":"s","kind":"text","source":"Shared"}],
         "parts":[
           {"id":"p1","responseType":"WRITTEN","prompt":[{"id":"a","kind":"text","source":"Part A"}],"options":[]},
           {"id":"p2","responseType":"WRITTEN","prompt":[{"id":"b","kind":"text","source":"Part B"}],"options":[]}
         ]}
        """);
    assertThatCode(() -> validator.requirePublishable("written_multipart", prompts, mapper.createObjectNode(), null, Set.of()))
        .doesNotThrowAnyException();
  }

  @Test
  void publishRejectsDanglingAnswerAndExplanationParts() throws Exception {
    JsonNode written = mapper.readTree("""
        {"schemaVersion":1,"title":"Prove","structure":"SINGLE","stem":[{"id":"s","kind":"text","source":"Show it"}],
         "parts":[{"id":"p","responseType":"WRITTEN","prompt":[],"options":[]}]}
        """);
    JsonNode danglingAnswer = answer("[]", "other");
    assertThatThrownBy(() -> validator.requirePublishable("written", written, danglingAnswer, null, Set.of()))
        .isInstanceOf(ApiException.class);
    JsonNode danglingExplanation = mapper.readTree(
        "{\"parts\":[{\"partId\":\"other\",\"solution\":[],\"rubric\":\"\"}]}");
    assertThatThrownBy(() -> validator.requirePublishable(
            "written", written, mapper.readTree("{\"parts\":[]}"), danglingExplanation, Set.of()))
        .isInstanceOf(ApiException.class);
  }

  private JsonNode choice(String response, int options) throws Exception {
    String optionJson = options == 1
        ? "{\"id\":\"a\",\"content\":[{\"id\":\"oa\",\"kind\":\"text\",\"source\":\"A\"}]}"
        : "{\"id\":\"a\",\"content\":[{\"id\":\"oa\",\"kind\":\"text\",\"source\":\"A\"}]},"
            + "{\"id\":\"b\",\"content\":[{\"id\":\"ob\",\"kind\":\"text\",\"source\":\"B\"}]}";
    return mapper.readTree("""
        {"schemaVersion":1,"title":"Pick","structure":"SINGLE","stem":[],
         "parts":[{"id":"p","responseType":"%s","prompt":[{"id":"q","kind":"text","source":"Choose"}],"options":[%s]}]}
        """.formatted(response, optionJson));
  }

  private JsonNode answer(String ids, String partId) throws Exception {
    return mapper.readTree("{\"parts\":[{\"partId\":\"%s\",\"correctOptionIds\":%s}]}".formatted(partId, ids));
  }
}
