package me.nghlong3004.olympic.assessment.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@ConfigurationProperties(prefix = "olympic.assessment.import")
public record AssessmentImportProperties(Gemini gemini, int maxFileSizeMb, int maxPages) {

  public AssessmentImportProperties {
    gemini = gemini == null ? new Gemini("", "gemini-2.5-flash", 8192) : gemini;
    maxFileSizeMb = maxFileSizeMb <= 0 ? 25 : maxFileSizeMb;
    maxPages = maxPages <= 0 ? 100 : maxPages;
  }

  public record Gemini(String apiKey, String model, int maxTokens) {}
}
