package me.nghlong3004.olympic.exam.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.exam.ExamLimits;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public record SaveExamDraftRequest(
    @Schema(description = "Draft title. Blank is allowed until publish.")
        @Size(max = ExamLimits.MAX_TITLE)
        String title,
    @Schema(description = "Subject identifier") @NotNull UUID subjectId,
    @Schema(description = "Exam instructions, stored in authored order")
        @Size(max = ExamLimits.MAX_INSTRUCTIONS)
        String instructions,
    @Schema(description = "Release time. Null is allowed on a draft.") OffsetDateTime releaseAt,
    @Schema(description = "Ordered placements")
        @NotNull
        @Size(max = ExamLimits.MAX_PLACEMENTS)
        @Valid
        List<@NotNull @Valid ExamItemRequest> items,
    @Schema(description = "Optimistic draft version. Required on update; ignored on create.")
        Long expectedVersion) {}
