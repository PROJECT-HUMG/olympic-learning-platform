package me.nghlong3004.olympic.recognition.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import me.nghlong3004.olympic.recognition.enums.HonorScope;
import me.nghlong3004.olympic.recognition.enums.HonorStatus;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
public record SaveHonorRequest(
    @Schema(example = "Olympic Toán năm 2026") @NotBlank @Size(max = 200) String title,
    @NotBlank @Size(max = 100) String subject,
    @Min(1900) @Max(2100) int year,
    @Size(max = 10000) String description,
    @NotNull HonorScope scope,
    @NotNull HonorStatus status,
    @NotNull @Size(max = 200) List<@NotNull @Valid HonorParticipantRequest> participants,
    @Schema(description = "Required on update; omitted on create") @Min(0) Long expectedVersion) {}
