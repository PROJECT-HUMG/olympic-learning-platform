package me.nghlong3004.olympic.auth.dto;

import me.nghlong3004.olympic.auth.enums.AuthEmailTokenPurpose;
import me.nghlong3004.olympic.user.entity.User;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/16/2026
 */
public record AuthEmailTokenConsumption(User user, AuthEmailTokenPurpose purpose) {}
