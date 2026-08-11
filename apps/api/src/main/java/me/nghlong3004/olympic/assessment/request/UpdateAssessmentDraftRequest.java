package me.nghlong3004.olympic.assessment.request;

import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public record UpdateAssessmentDraftRequest(
    @Schema(description = "Edited structured question content") JsonNode content,
    @Schema(description = "Edited answer payload") JsonNode answer,
    @Schema(description = "Lecturer confidence override", example = "0.85")
        @DecimalMin("0.0") @DecimalMax("1.0") BigDecimal confidence) {}
