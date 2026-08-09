package me.nghlong3004.olympic.assessment.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.UUID;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportPhase;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportStatus;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public record AssessmentImportStatusResponse(
    UUID id,
    AssessmentImportStatus status,
    AssessmentImportPhase phase,
    int progress,
    int totalPages,
    int processedPages,
    int draftCount,
    int warningCount,
    String lastError,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt) {}
