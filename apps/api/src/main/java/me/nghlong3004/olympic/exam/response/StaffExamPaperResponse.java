package me.nghlong3004.olympic.exam.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Staff paper without solutions. Preview leaves id, versionNumber, and publishedAt null.
 * releaseAt is null when the draft has no release time. A frozen paper sets all four.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public record StaffExamPaperResponse(
    @Schema(description = "Paper id, null for a draft preview") UUID id,
    @Schema(description = "Parent draft id") UUID examId,
    @Schema(description = "Published version, null for a draft preview") Integer versionNumber,
    @Schema(description = "Title") String title,
    @Schema(description = "Subject id") UUID subjectId,
    @Schema(description = "Instructions") String instructions,
    @Schema(description = "Release time, null while the draft has none") OffsetDateTime releaseAt,
    @Schema(description = "Publication time, null for a draft preview") OffsetDateTime publishedAt,
    @Schema(description = "Total points") BigDecimal totalPoints,
    @Schema(description = "Items without answers") List<StaffExamItemResponse> items)
    implements ExamPaperView {}
