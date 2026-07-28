package me.nghlong3004.olympic.document.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "UpdateDocumentCategoryRequest", description = "Payload for updating an existing document category")
public record UpdateDocumentCategoryRequest(
    @Schema(description = "Code of the category", example = "MATH")
        @NotBlank(message = "Code is required")
        @Size(max = 100, message = "Code must not exceed 100 characters")
        String code,

    @Schema(description = "Name of the category", example = "Toán Học (Đã sửa)")
        @NotBlank(message = "Name is required")
        @Size(max = 255, message = "Name must not exceed 255 characters")
        String name,

    @Schema(description = "Description of the category", example = "Danh mục chứa các tài liệu toán học")
        String description) {}
