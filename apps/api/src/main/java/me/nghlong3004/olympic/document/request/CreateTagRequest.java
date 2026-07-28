package me.nghlong3004.olympic.document.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "CreateTagRequest", description = "Payload for creating a new tag")
public record CreateTagRequest(
    @Schema(description = "Code of the tag", example = "IMPORTANT")
        @NotBlank(message = "Code is required")
        @Size(max = 100, message = "Code must not exceed 100 characters")
        String code,

    @Schema(description = "Name of the tag", example = "Quan trọng")
        @NotBlank(message = "Name is required")
        @Size(max = 255, message = "Name must not exceed 255 characters")
        String name) {}
