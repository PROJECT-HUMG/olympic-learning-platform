package me.nghlong3004.olympic.storage.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/14/2026
 */
public record StorageUploadResponse(
    @Schema(description = "Persisted file identity") UUID id,
    @Schema(description = "Resolved file download URL") String url) {}
