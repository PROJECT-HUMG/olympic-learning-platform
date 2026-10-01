package me.nghlong3004.olympic.studyroom.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/01/2026
 */
public record RequestStudyRoomTrackRequest(
    @Schema(example = "https://www.youtube.com/watch?v=jfKfPfyJRdk") @NotBlank @Size(max = 2048) String youtubeUrl,
    @Schema(example = "Nhạc học bài") @NotBlank @Size(max = 120) String title) {}
