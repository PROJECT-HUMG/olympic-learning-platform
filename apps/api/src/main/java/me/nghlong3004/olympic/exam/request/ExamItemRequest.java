package me.nghlong3004.olympic.exam.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import me.nghlong3004.olympic.exam.ExamLimits;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public record ExamItemRequest(
    @Schema(description = "Published schemaVersion 1 question") @NotNull UUID questionId,
    @Schema(description = "Positive points, at most 1000.00 with two decimal places")
        @NotNull
        @DecimalMin("0.01")
        @DecimalMax(ExamLimits.MAX_ITEM_POINTS)
        @Digits(integer = 4, fraction = 2)
        BigDecimal points,
    @Schema(description = "Per-part weights. An empty object is allowed for a single-part item.")
        @NotNull
        Map<
                @NotBlank @Size(max = 80) String,
                @NotNull
                    @DecimalMin("0.01")
                    @DecimalMax(ExamLimits.MAX_ITEM_POINTS)
                    @Digits(integer = 4, fraction = 2)
                    BigDecimal>
            partPoints,
    @Schema(description = "Placement instructions, kept in request order")
        @Size(max = ExamLimits.MAX_INSTRUCTIONS)
        String instructions) {}
