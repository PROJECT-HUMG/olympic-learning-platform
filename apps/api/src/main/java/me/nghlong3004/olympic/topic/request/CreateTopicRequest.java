package me.nghlong3004.olympic.topic.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public record CreateTopicRequest(
    @Schema(description = "Subject identifier") @NotNull UUID subjectId,
    @Schema(description = "Topic name", example = "Combinatorics") @NotBlank @Size(max = 255)
        String name) {}
