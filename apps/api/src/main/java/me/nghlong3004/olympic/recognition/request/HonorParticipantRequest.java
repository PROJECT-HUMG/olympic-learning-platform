package me.nghlong3004.olympic.recognition.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
public record HonorParticipantRequest(
    @Schema(description = "Existing user, or leave blank for a historical participant") UUID userId,
    @Size(max = 200) String fullName,
    @Size(max = 100) String award) {}
