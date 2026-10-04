package me.nghlong3004.olympic.question.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public record QuestionFigureResponse(
    @Schema(description = "Figure identifier") UUID id,
    @Schema(example = "image/png") String contentType,
    @Schema(example = "128") long size,
    @Schema(example = "diagram.png") String originalName) {}
