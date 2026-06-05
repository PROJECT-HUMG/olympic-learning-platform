package me.nghlong3004.olympic.api.auth.service;

import me.nghlong3004.olympic.api.auth.dto.AuthResponse;
import me.nghlong3004.olympic.api.auth.dto.LoginRequest;
import me.nghlong3004.olympic.api.auth.dto.RefreshTokenRequest;
import me.nghlong3004.olympic.api.auth.dto.RegisterRequest;

import java.util.UUID;

/**
 * Service interface for authentication operations.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refresh(RefreshTokenRequest request);

    void logout(UUID userPublicId);
}
