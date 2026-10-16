package me.nghlong3004.olympic.daily.sharing.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/16/2026
 */
public record SaveDailySharingRequest(
    @NotNull @PositiveOrZero Long expectedVersion,
    @NotNull @Size(max = 50) List<@NotNull @Valid Audience> audiences) {
  public record Audience(
      @NotNull UUID groupId, @NotNull @Size(max = 500) List<@NotNull UUID> viewerIds) {}
}
