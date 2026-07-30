package me.nghlong3004.olympic.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/16/2026
 */
public record LoginRequest(
    @Schema(example = "admin@nghlong3004.me hoặc admin")
        @NotBlank(message = "Tên đăng nhập hoặc Email không được để trống")
        String identifier,
    @Schema(example = "change-me") @NotBlank(message = "Password is required") String password) {}
