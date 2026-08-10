package me.nghlong3004.olympic.topic.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/** @author nghlong3004 (Long Nguyen Hoang) @since 8/10/2026 */
public record CreateTopicRequest(@NotNull UUID subjectId, @NotBlank String name) {}
