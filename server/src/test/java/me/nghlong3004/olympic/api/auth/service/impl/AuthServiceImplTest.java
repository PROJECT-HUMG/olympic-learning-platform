package me.nghlong3004.olympic.api.auth.service.impl;

import me.nghlong3004.olympic.api.auth.dto.AuthResult;
import me.nghlong3004.olympic.api.auth.dto.LoginRequest;
import me.nghlong3004.olympic.api.auth.dto.RegisterRequest;
import me.nghlong3004.olympic.api.auth.entity.RefreshToken;
import me.nghlong3004.olympic.api.auth.repository.RefreshTokenRepository;
import me.nghlong3004.olympic.api.auth.service.JwtTokenService;
import me.nghlong3004.olympic.api.common.exception.BusinessRuleException;
import me.nghlong3004.olympic.api.common.exception.DuplicateResourceException;
import me.nghlong3004.olympic.api.user.entity.Role;
import me.nghlong3004.olympic.api.user.entity.User;
import me.nghlong3004.olympic.api.user.repository.RoleRepository;
import me.nghlong3004.olympic.api.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

/**
 * Unit tests for {@link AuthServiceImpl}.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthServiceImpl")
class AuthServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenService jwtTokenService;

    @InjectMocks private AuthServiceImpl authService;

    private Role studentRole;
    private User testUser;

    @BeforeEach
    void setUp() {
        studentRole = Role.builder()
                .id(1L)
                .name("STUDENT")
                .build();

        testUser = User.builder()
                .email("test@humg.edu.vn")
                .passwordHash("$2a$10$hashedpassword")
                .fullName("Nguyen Van A")
                .role(studentRole)
                .enabled(true)
                .build();
        testUser.setId(1L);
    }

    @Nested
    @DisplayName("register()")
    class Register {

        @Test
        @DisplayName("should register user successfully with STUDENT role")
        void shouldRegisterSuccessfully() {
            // given
            var request = new RegisterRequest(
                    "new@humg.edu.vn", "Password1", "Tran Van B", "0901234567", "DH001"
            );
            given(userRepository.existsByEmail("new@humg.edu.vn")).willReturn(false);
            given(roleRepository.findByName("STUDENT")).willReturn(Optional.of(studentRole));
            given(passwordEncoder.encode("Password1")).willReturn("$2a$10$encoded");
            given(userRepository.save(any(User.class))).willAnswer(inv -> {
                User saved = inv.getArgument(0);
                saved.setId(2L);
                return saved;
            });
            given(jwtTokenService.createAccessToken(any(User.class))).willReturn("access-token");
            given(jwtTokenService.getRefreshTokenExpiration()).willReturn(Instant.now().plus(7, ChronoUnit.DAYS));
            given(jwtTokenService.getAccessTokenExpiration()).willReturn(Instant.now().plus(15, ChronoUnit.MINUTES));
            given(refreshTokenRepository.save(any(RefreshToken.class))).willAnswer(inv -> inv.getArgument(0));

            // when
            AuthResult result = authService.register(request);

            // then
            assertThat(result).isNotNull();
            assertThat(result.response().accessToken()).isEqualTo("access-token");
            assertThat(result.response().tokenType()).isEqualTo("Bearer");
            assertThat(result.refreshToken()).isNotBlank();
            assertThat(result.refreshExpiresAt()).isAfter(Instant.now());
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("should throw DuplicateResourceException when email exists")
        void shouldThrowWhenEmailExists() {
            var request = new RegisterRequest(
                    "existing@humg.edu.vn", "Password1", "Tran Van C", null, null
            );
            given(userRepository.existsByEmail("existing@humg.edu.vn")).willReturn(true);

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("email");
        }

        @Test
        @DisplayName("should throw NullPointerException for null request")
        void shouldThrowForNullRequest() {
            assertThatThrownBy(() -> authService.register(null))
                    .isInstanceOf(NullPointerException.class);
        }
    }

    @Nested
    @DisplayName("login()")
    class Login {

        @Test
        @DisplayName("should login successfully with valid credentials")
        void shouldLoginSuccessfully() {
            // given
            var request = new LoginRequest("test@humg.edu.vn", "correctpassword");
            given(userRepository.findByEmail("test@humg.edu.vn")).willReturn(Optional.of(testUser));
            given(passwordEncoder.matches("correctpassword", testUser.getPasswordHash())).willReturn(true);
            given(jwtTokenService.createAccessToken(testUser)).willReturn("access-token");
            given(jwtTokenService.getRefreshTokenExpiration()).willReturn(Instant.now().plus(7, ChronoUnit.DAYS));
            given(jwtTokenService.getAccessTokenExpiration()).willReturn(Instant.now().plus(15, ChronoUnit.MINUTES));
            given(refreshTokenRepository.save(any(RefreshToken.class))).willAnswer(inv -> inv.getArgument(0));

            // when
            AuthResult result = authService.login(request);

            // then
            assertThat(result).isNotNull();
            assertThat(result.response().accessToken()).isEqualTo("access-token");
            assertThat(result.response().tokenType()).isEqualTo("Bearer");
            assertThat(result.refreshToken()).isNotBlank();
        }

        @Test
        @DisplayName("should throw BadCredentialsException when user not found")
        void shouldThrowWhenUserNotFound() {
            var request = new LoginRequest("unknown@humg.edu.vn", "password");
            given(userRepository.findByEmail("unknown@humg.edu.vn")).willReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessage("Invalid credentials");
        }

        @Test
        @DisplayName("should throw BadCredentialsException when password is wrong")
        void shouldThrowWhenPasswordWrong() {
            var request = new LoginRequest("test@humg.edu.vn", "wrongpassword");
            given(userRepository.findByEmail("test@humg.edu.vn")).willReturn(Optional.of(testUser));
            given(passwordEncoder.matches("wrongpassword", testUser.getPasswordHash())).willReturn(false);

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessage("Invalid credentials");
        }

        @Test
        @DisplayName("should throw BusinessRuleException when account is disabled")
        void shouldThrowWhenAccountDisabled() {
            testUser.setEnabled(false);
            var request = new LoginRequest("test@humg.edu.vn", "correctpassword");
            given(userRepository.findByEmail("test@humg.edu.vn")).willReturn(Optional.of(testUser));
            given(passwordEncoder.matches("correctpassword", testUser.getPasswordHash())).willReturn(true);

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("disabled");
        }
    }

    @Nested
    @DisplayName("refresh()")
    class Refresh {

        @Test
        @DisplayName("should refresh token successfully")
        void shouldRefreshSuccessfully() {
            // given
            var refreshToken = RefreshToken.builder()
                    .token("valid-refresh-token")
                    .user(testUser)
                    .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                    .revoked(false)
                    .build();
            refreshToken.setId(1L);

            given(refreshTokenRepository.findByToken("valid-refresh-token")).willReturn(Optional.of(refreshToken));
            given(refreshTokenRepository.save(any(RefreshToken.class))).willAnswer(inv -> inv.getArgument(0));
            given(jwtTokenService.createAccessToken(testUser)).willReturn("new-access-token");
            given(jwtTokenService.getRefreshTokenExpiration()).willReturn(Instant.now().plus(7, ChronoUnit.DAYS));
            given(jwtTokenService.getAccessTokenExpiration()).willReturn(Instant.now().plus(15, ChronoUnit.MINUTES));

            // when
            AuthResult result = authService.refresh("valid-refresh-token");

            // then
            assertThat(result.response().accessToken()).isEqualTo("new-access-token");
            assertThat(refreshToken.isRevoked()).isTrue(); // old token revoked
        }

        @Test
        @DisplayName("should throw when refresh token not found")
        void shouldThrowWhenTokenNotFound() {
            given(refreshTokenRepository.findByToken("invalid-token")).willReturn(Optional.empty());

            assertThatThrownBy(() -> authService.refresh("invalid-token"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Invalid refresh token");
        }

        @Test
        @DisplayName("should throw when refresh token is expired")
        void shouldThrowWhenTokenExpired() {
            var expiredToken = RefreshToken.builder()
                    .token("expired-token")
                    .user(testUser)
                    .expiresAt(Instant.now().minus(1, ChronoUnit.HOURS))
                    .revoked(false)
                    .build();
            expiredToken.setId(1L);
            given(refreshTokenRepository.findByToken("expired-token")).willReturn(Optional.of(expiredToken));

            assertThatThrownBy(() -> authService.refresh("expired-token"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("expired or revoked");
        }
    }

    @Nested
    @DisplayName("logout()")
    class Logout {

        @Test
        @DisplayName("should revoke all refresh tokens for user")
        void shouldLogoutSuccessfully() {
            // given
            UUID publicId = testUser.getPublicId();
            given(userRepository.findByPublicId(publicId)).willReturn(Optional.of(testUser));
            given(refreshTokenRepository.revokeAllByUserId(testUser.getId())).willReturn(3);

            // when
            authService.logout(publicId);

            // then
            verify(refreshTokenRepository).revokeAllByUserId(testUser.getId());
        }
    }
}
