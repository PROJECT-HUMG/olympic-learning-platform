package me.nghlong3004.olympic.exam.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Editable exam draft. releaseAt is null until the author sets it.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public record ExamDraftResponse(
    @Schema(description = "Draft identifier") UUID id,
    @Schema(description = "Author identifier") UUID createdById,
    @Schema(description = "Optimistic version") long version,
    @Schema(description = "Latest published version, if any") Integer latestPublishedVersion,
    @Schema(description = "Sum of item points") BigDecimal totalPoints,
    @Schema(description = "Draft title") String title,
    @Schema(description = "Subject identifier") UUID subjectId,
    @Schema(description = "Exam instructions") String instructions,
    @Schema(description = "Release time, null while unset") OffsetDateTime releaseAt,
    @Schema(description = "Ordered placements") List<ExamItemResponse> items) {}
