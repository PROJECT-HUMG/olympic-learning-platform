package me.nghlong3004.olympic.api.auth.service;

import me.nghlong3004.olympic.api.auth.dto.AuthResult;
import me.nghlong3004.olympic.api.auth.dto.LoginRequest;
import me.nghlong3004.olympic.api.auth.dto.RegisterRequest;

import java.util.UUID;

/**
 * Service interface for authentication operations.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
public interface AuthService {

    AuthResult register(RegisterRequest request);

    AuthResult login(LoginRequest request);

    AuthResult refresh(String refreshToken);

    void logout(UUID userPublicId);
}
