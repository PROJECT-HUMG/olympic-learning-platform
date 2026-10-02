package me.nghlong3004.olympic.studyroom.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
public record UpdateStudyRoomRhythmRequest(
    @Schema(example = "25") @NotNull @Min(15) @Max(90) Integer focusMinutes,
    @Schema(example = "5") @NotNull @Min(3) @Max(30) Integer breakMinutes,
    @Schema(example = "15") @NotNull @Min(10) @Max(45) Integer longBreakMinutes,
    @Schema(description = "Current rhythm version; protects against stale or repeated updates", example = "0")
        @NotNull @Min(0) Long expectedVersion) {
  @AssertTrue(message = "Nghỉ dài phải ít nhất bằng thời gian nghỉ ngắn.")
  @Schema(hidden = true)
  public boolean isValidBreakRhythm() {
    return breakMinutes == null || longBreakMinutes == null || longBreakMinutes >= breakMinutes;
  }
}
