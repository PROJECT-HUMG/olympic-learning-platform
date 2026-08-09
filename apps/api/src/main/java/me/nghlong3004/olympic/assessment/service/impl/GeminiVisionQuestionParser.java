package me.nghlong3004.olympic.assessment.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.assessment.dto.AssessmentPage;
import me.nghlong3004.olympic.assessment.dto.ParsedAssessmentPage;
import me.nghlong3004.olympic.assessment.dto.ParsedQuestion;
import me.nghlong3004.olympic.assessment.properties.AssessmentImportProperties;
import me.nghlong3004.olympic.assessment.service.VisionQuestionParser;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Gemini Vision adapter. The provider is deliberately isolated from the assessment domain.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiVisionQuestionParser implements VisionQuestionParser {

  private final ObjectMapper objectMapper;
  private final AssessmentImportProperties properties;

  @Override
  public ParsedAssessmentPage parse(AssessmentPage page) {
    var gemini = properties.gemini();
    if (gemini.apiKey() == null || gemini.apiKey().isBlank()) {
      throw new IllegalStateException("Gemini Vision is not configured");
    }

    var prompt = """
        Parse this Vietnamese mathematics assessment page into JSON.
        Detect question boundaries, choices, formulas and diagrams. Return only JSON with this shape:
        {"questions":[{"questionNumber":"12","content":{},"answer":{},"confidence":0.0,
        "questionBbox":{"left":0,"top":0,"right":1,"bottom":1},
        "assetRegions":[{"bbox":{"left":0,"top":0,"right":1,"bottom":1},"role":"DIAGRAM","altText":""}],
        "warnings":[]}]}
        Coordinates must be normalized between 0 and 1. Never invent an answer; put a warning when it is unclear.
        """;
    var request = Map.of(
        "contents", List.of(Map.of("parts", List.of(
            Map.of("text", prompt + "\nText layer:\n" + page.text()),
            Map.of("inline_data", Map.of("mime_type", "image/png", "data", Base64.getEncoder().encodeToString(page.image())))
        ))),
        "generationConfig", Map.of("temperature", 0, "maxOutputTokens", gemini.maxTokens(), "responseMimeType", "application/json"));

    var response = RestClient.create("https://generativelanguage.googleapis.com")
        .post()
        .uri(uriBuilder -> uriBuilder.path("/v1beta/models/{model}:generateContent").queryParam("key", gemini.apiKey()).build(gemini.model()))
        .contentType(MediaType.APPLICATION_JSON)
        .body(request)
        .retrieve()
        .body(JsonNode.class);

    try {
      var text = response.at("/candidates/0/content/parts/0/text").asText();
      var json = objectMapper.readTree(text);
      var parsed = new java.util.ArrayList<ParsedQuestion>();
      json.path("questions").forEach(question ->
          parsed.add(objectMapper.convertValue(question, ParsedQuestion.class)));
      return new ParsedAssessmentPage(page.pageNumber(), parsed);
    } catch (Exception exception) {
      log.warn("Gemini returned an invalid assessment payload: page={}", page.pageNumber());
      throw new IllegalStateException("Vision parser returned invalid JSON", exception);
    }
  }
}
