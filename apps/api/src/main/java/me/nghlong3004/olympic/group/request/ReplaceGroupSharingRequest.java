package me.nghlong3004.olympic.group.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.group.enums.SharingMode;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public record ReplaceGroupSharingRequest(
    @Schema(description = "Explicit own sharing consent") @NotNull Boolean shareDaily,
    @NotNull SharingMode sharingMode,
    @NotNull @Size(max = 500) List<@NotNull UUID> selectedViewerIds) {}
