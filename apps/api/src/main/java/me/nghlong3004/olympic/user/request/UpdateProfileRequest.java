package me.nghlong3004.olympic.user.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/23/2026
 */
public record UpdateProfileRequest(
    @NotBlank(message = "{validation.user.full-name.required}")
        @Size(max = 100, message = "{validation.user.full-name.max-length}")
        String fullName) {}
