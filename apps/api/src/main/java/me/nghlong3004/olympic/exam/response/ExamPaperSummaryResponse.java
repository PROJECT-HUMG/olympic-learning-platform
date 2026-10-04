package me.nghlong3004.olympic.exam.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Released paper summary. It has no items, answers, or explanations.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public record ExamPaperSummaryResponse(
    @Schema(description = "Paper identifier") UUID id,
    @Schema(description = "Parent draft identifier") UUID examId,
    @Schema(description = "Published version number") int versionNumber,
    @Schema(description = "Frozen title") String title,
    @Schema(description = "Subject identifier") UUID subjectId,
    @Schema(description = "Release time") OffsetDateTime releaseAt,
    @Schema(description = "Publication time") OffsetDateTime publishedAt,
    @Schema(description = "Frozen total points") BigDecimal totalPoints) {}
