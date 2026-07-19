package me.nghlong3004.olympic.auth.response;

import java.util.UUID;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/16/2026
 */
public record CurrentUserResponse(
    UUID id,
    String email,
    String username,
    String fullName,
    String avatarUrl,
    Role role,
    Status status) {}
