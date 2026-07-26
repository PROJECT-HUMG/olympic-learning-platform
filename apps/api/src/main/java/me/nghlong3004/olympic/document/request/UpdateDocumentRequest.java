package me.nghlong3004.olympic.document.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Set;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
public record UpdateDocumentRequest(
    @NotBlank @Size(max = 255) String title,
    @Size(max = 5000) String description,
    @NotNull UUID categoryId,
    @NotNull UUID subjectId,
    @NotEmpty Set<UUID> tagIds) {}
