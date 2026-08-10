package me.nghlong3004.olympic.question.request;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/** @author nghlong3004 (Long Nguyen Hoang) @since 8/10/2026 */
public record UpdateQuestionRequest(
    @NotNull UUID subjectId,
    @NotNull UUID topicId,
    @NotBlank String type,
    @NotNull JsonNode content,
    @NotNull JsonNode answer,
    JsonNode explanation,
    String difficulty) {}
