package me.nghlong3004.olympic.common.security;

import java.io.Serializable;
import java.util.UUID;
import lombok.Builder;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/16/2026
 */
@Builder
public record CurrentUser(
    UUID id, String email, String username, String fullName, Role role, Status status)
    implements Serializable {}
