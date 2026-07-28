package me.nghlong3004.olympic.document.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "CreateSubjectRequest", description = "Payload for creating a new subject")
public record CreateSubjectRequest(
    @Schema(description = "Code of the subject", example = "MATH_101")
        @NotBlank(message = "Code is required")
        @Size(max = 100, message = "Code must not exceed 100 characters")
        String code,

    @Schema(description = "Name of the subject", example = "Toán Cao Cấp 1")
        @NotBlank(message = "Name is required")
        @Size(max = 255, message = "Name must not exceed 255 characters")
        String name,

    @Schema(description = "Description of the subject", example = "Môn học Toán Cao Cấp 1")
        String description) {}
