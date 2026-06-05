package me.nghlong3004.olympic.api.auth.service;

import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.api.auth.dto.AuthResponse;
import me.nghlong3004.olympic.api.auth.dto.LoginRequest;
import me.nghlong3004.olympic.api.auth.dto.RefreshTokenRequest;
import me.nghlong3004.olympic.api.auth.dto.RegisterRequest;
import me.nghlong3004.olympic.api.auth.entity.RefreshToken;
import me.nghlong3004.olympic.api.auth.repository.RefreshTokenRepository;
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

import java.util.Objects;
import java.util.UUID;

/**
 * Service handling authentication flows: register, login, refresh, and logout.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    /**
     * Registers a new user with STUDENT role by default.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        Objects.requireNonNull(request, "request must not be null");

        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("User", "email", request.email());
        }

        var role = roleRepository.findByName("STUDENT")
                .orElseThrow(() -> new ResourceNotFoundException("Role", "STUDENT"));

        var user = User.of(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.fullName(),
                role
        );
        user.setPhone(request.phone());
        user.setStudentCode(request.studentCode());

        user = userRepository.save(user);

        return createAuthResponse(user);
    }

    /**
     * Authenticates a user with email and password.
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        Objects.requireNonNull(request, "request must not be null");

        var user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        if (!user.isEnabled()) {
            throw new BusinessRuleException("ACCOUNT_DISABLED", "Account is disabled");
        }

        return createAuthResponse(user);
    }

    /**
     * Refreshes access token using a valid refresh token.
     */
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        Objects.requireNonNull(request, "request must not be null");

        var refreshToken = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new BusinessRuleException("INVALID_REFRESH_TOKEN", "Invalid refresh token"));

        if (!refreshToken.isUsable()) {
            throw new BusinessRuleException("REFRESH_TOKEN_EXPIRED", "Refresh token is expired or revoked");
        }

        // Revoke old token and create new pair
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        return createAuthResponse(refreshToken.getUser());
    }

    /**
     * Revokes all refresh tokens for the given user (logout from all devices).
     */
    @Transactional
    public void logout(UUID userPublicId) {
        var user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userPublicId));
        refreshTokenRepository.revokeAllByUserId(user.getId());
    }

    private AuthResponse createAuthResponse(User user) {
        String accessToken = jwtTokenService.createAccessToken(user);

        var refreshToken = RefreshToken.of(
                UUID.randomUUID().toString(),
                user,
                jwtTokenService.getRefreshTokenExpiration()
        );
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.of(
                accessToken,
                refreshToken.getToken(),
                jwtTokenService.getAccessTokenExpiration()
        );
    }
}
