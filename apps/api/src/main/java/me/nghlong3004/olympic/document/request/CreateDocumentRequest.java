package me.nghlong3004.olympic.document.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Set;
import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Payload for creating a new document.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
@Schema(name = "CreateDocumentRequest", description = "Payload for creating a new document")
public record CreateDocumentRequest(
    @Schema(description = "Title of the document", example = "Tài liệu Toán Cao Cấp")
        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title must not exceed 255 characters")
        String title,

    @Schema(description = "Description of the document", example = "Tài liệu môn Toán dành cho sinh viên năm 1")
        @Size(max = 5000, message = "Description must not exceed 5000 characters")
        String description,

    @Schema(description = "ID of the category", example = "123e4567-e89b-12d3-a456-426614174000")
        @NotNull(message = "Category ID is required")
        UUID categoryId,

    @Schema(description = "ID of the subject", example = "123e4567-e89b-12d3-a456-426614174001")
        @NotNull(message = "Subject ID is required")
        UUID subjectId,

    @Schema(description = "Set of tag IDs", example = "[\"123e4567-e89b-12d3-a456-426614174002\"]")
        @NotEmpty(message = "At least one tag ID is required")
        Set<UUID> tagIds,

    @Schema(description = "ID of the uploaded file", example = "123e4567-e89b-12d3-a456-426614174003")
        @NotNull(message = "File ID is required")
        UUID fileId) {}
