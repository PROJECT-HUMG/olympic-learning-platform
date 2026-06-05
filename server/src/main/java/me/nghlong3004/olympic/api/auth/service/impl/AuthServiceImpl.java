package me.nghlong3004.olympic.api.auth.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.api.auth.dto.AuthResponse;
import me.nghlong3004.olympic.api.auth.dto.AuthResult;
import me.nghlong3004.olympic.api.auth.dto.LoginRequest;
import me.nghlong3004.olympic.api.auth.dto.RegisterRequest;
import me.nghlong3004.olympic.api.auth.entity.RefreshToken;
import me.nghlong3004.olympic.api.auth.repository.RefreshTokenRepository;
import me.nghlong3004.olympic.api.auth.service.AuthService;
import me.nghlong3004.olympic.api.auth.service.JwtTokenService;
import me.nghlong3004.olympic.api.common.exception.BusinessRuleException;
import me.nghlong3004.olympic.api.common.exception.DuplicateResourceException;
import me.nghlong3004.olympic.api.common.exception.ResourceNotFoundException;
import me.nghlong3004.olympic.api.user.entity.User;
import me.nghlong3004.olympic.api.user.repository.RoleRepository;
import me.nghlong3004.olympic.api.user.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Implementation of {@link AuthService}.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    @Override
    @Transactional
    public AuthResult register(RegisterRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        log.debug("Processing registration request");

        if (userRepository.existsByEmail(request.email())) {
            log.warn("Registration failed: duplicate email detected");
            throw new DuplicateResourceException("User", "email", request.email());
        }

        var role = roleRepository.findByName("STUDENT")
                .orElseThrow(() -> new ResourceNotFoundException("Role", "STUDENT"));

        var user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .phone(request.phone())
                .studentCode(request.studentCode())
                .role(role)
                .build();

        user = userRepository.save(user);
        log.info("User registered successfully: userId={}", user.getPublicId());

        return createAuthResult(user);
    }

    @Override
    @Transactional
    public AuthResult login(LoginRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        log.debug("Processing login attempt");

        var user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> {
                    log.warn("Login failed: user not found");
                    return new BadCredentialsException("Invalid credentials");
                });

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            log.warn("Login failed: invalid password for userId={}", user.getPublicId());
            throw new BadCredentialsException("Invalid credentials");
        }

        if (!user.isEnabled()) {
            log.warn("Login failed: account disabled for userId={}", user.getPublicId());
            throw new BusinessRuleException("ACCOUNT_DISABLED", "Account is disabled");
        }

        log.info("User logged in successfully: userId={}", user.getPublicId());
        return createAuthResult(user);
    }

    @Override
    @Transactional
    public AuthResult refresh(String refreshTokenValue) {
        Objects.requireNonNull(refreshTokenValue, "refreshToken must not be null");
        log.debug("Processing token refresh");

        var refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> {
                    log.warn("Token refresh failed: token not found");
                    return new BusinessRuleException("INVALID_REFRESH_TOKEN", "Invalid refresh token");
                });

        if (!refreshToken.isUsable()) {
            log.warn("Token refresh failed: token expired or revoked for userId={}",
                    refreshToken.getUser().getPublicId());
            throw new BusinessRuleException("REFRESH_TOKEN_EXPIRED", "Refresh token is expired or revoked");
        }

        // Revoke old token and create new pair
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        log.info("Token refreshed successfully for userId={}", refreshToken.getUser().getPublicId());
        return createAuthResult(refreshToken.getUser());
    }

    @Override
    @Transactional
    public void logout(UUID userPublicId) {
        log.debug("Processing logout for userId={}", userPublicId);

        var user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userPublicId));

        int revokedCount = refreshTokenRepository.revokeAllByUserId(user.getId());
        log.info("User logged out: userId={}, revokedTokens={}", userPublicId, revokedCount);
    }

    private AuthResult createAuthResult(User user) {
        String accessToken = jwtTokenService.createAccessToken(user);
        Instant accessExpiresAt = jwtTokenService.getAccessTokenExpiration();
        Instant refreshExpiresAt = jwtTokenService.getRefreshTokenExpiration();

        var refreshToken = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiresAt(refreshExpiresAt)
                .build();
        refreshTokenRepository.save(refreshToken);

        return new AuthResult(
                AuthResponse.bearer(accessToken, accessExpiresAt),
                refreshToken.getToken(),
                refreshExpiresAt
        );
    }
}
