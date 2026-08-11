package me.nghlong3004.olympic.question.request;

import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public record UpdateQuestionRequest(
    @Schema(description = "Subject identifier") @NotNull UUID subjectId,
    @Schema(description = "Topic identifier") @NotNull UUID topicId,
    @Schema(description = "Question type", example = "multiple_choice")
        @NotBlank
        @Size(max = 80)
        String type,
    @Schema(description = "Structured question content") @NotNull JsonNode content,
    @Schema(description = "Structured answer payload") @NotNull JsonNode answer,
    @Schema(description = "Structured answer explanation") JsonNode explanation,
    @Schema(description = "Question difficulty", example = "MEDIUM")
        @Size(max = 30)
        String difficulty) {}
