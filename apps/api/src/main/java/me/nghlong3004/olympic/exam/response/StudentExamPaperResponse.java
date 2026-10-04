package me.nghlong3004.olympic.exam.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Released paper for a student. Items cannot carry answer or explanation.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public record StudentExamPaperResponse(
    @Schema(description = "Paper id") UUID id,
    @Schema(description = "Parent draft id") UUID examId,
    @Schema(description = "Published version") int versionNumber,
    @Schema(description = "Frozen title") String title,
    @Schema(description = "Subject id") UUID subjectId,
    @Schema(description = "Instructions") String instructions,
    @Schema(description = "Release time") OffsetDateTime releaseAt,
    @Schema(description = "Publication time") OffsetDateTime publishedAt,
    @Schema(description = "Total points") BigDecimal totalPoints,
    @Schema(description = "Visible items") List<StudentExamItemResponse> items)
    implements ExamPaperView {}
