package me.nghlong3004.olympic.daily.evidence.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import me.nghlong3004.olympic.daily.evidence.enums.EvidenceStage;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public record CreateEvidenceLinkRequest(
    @Schema(example = "START") @NotNull EvidenceStage stage,
    @Schema(example = "https://example.org/work") @NotBlank @Size(max = 2048) String url,
    @Schema(example = "Work notes") @NotBlank @Size(max = 200) String label) {}
