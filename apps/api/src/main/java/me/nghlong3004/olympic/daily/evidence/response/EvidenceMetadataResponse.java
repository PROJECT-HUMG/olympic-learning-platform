package me.nghlong3004.olympic.daily.evidence.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.OffsetDateTime;
import java.util.UUID;
import me.nghlong3004.olympic.daily.evidence.enums.EvidenceKind;
import me.nghlong3004.olympic.daily.evidence.enums.EvidenceStage;

/**
 * A list item and the complete single-record body of either 201 creation response.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@JsonInclude(JsonInclude.Include.ALWAYS)
public record EvidenceMetadataResponse(
    UUID id,
    UUID planId,
    UUID taskId,
    EvidenceStage stage,
    EvidenceKind kind,
    String originalName,
    String contentType,
    Long sizeBytes,
    String url,
    String label,
    OffsetDateTime createdAt) {}
