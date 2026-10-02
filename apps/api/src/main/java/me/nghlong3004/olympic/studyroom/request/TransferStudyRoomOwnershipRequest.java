package me.nghlong3004.olympic.studyroom.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
public record TransferStudyRoomOwnershipRequest(
    @Schema(description = "Active online member who will become the room owner")
        @NotNull UUID userId) {}
