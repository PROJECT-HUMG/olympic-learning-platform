package me.nghlong3004.olympic.group.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public record CreateGroupRequest(
    @Schema(example = "Nhóm học mỗi ngày") @NotBlank @Size(max = 120) String name) {}
