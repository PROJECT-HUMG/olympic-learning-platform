package me.nghlong3004.olympic.topic.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public record TopicResponse(
    @Schema(description = "Topic identifier") UUID id,
    @Schema(description = "Subject identifier") UUID subjectId,
    @Schema(example = "Combinatorics") String name,
    @Schema(example = "combinatorics") String slug) {}
