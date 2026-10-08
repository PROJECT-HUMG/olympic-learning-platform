package me.nghlong3004.olympic.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.auth.dto.RefreshTokenIssue;
import me.nghlong3004.olympic.auth.request.*;
import me.nghlong3004.olympic.auth.response.*;
import me.nghlong3004.olympic.auth.service.AuthService;
import me.nghlong3004.olympic.auth.service.RefreshTokenService;
import me.nghlong3004.olympic.auth.service.RegistrationVerificationService;
import me.nghlong3004.olympic.common.properties.SecurityProperties;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/15/2026
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Authentication, refresh token, logout, and current user APIs")
public class AuthController {

  private static final String REFRESH_COOKIE = "olympic_refresh_token";

  private final AuthService authService;
  private final RegistrationVerificationService registrationVerificationService;
  private final RefreshTokenService refreshTokenService;
  private final SecurityProperties securityProperties;

  @PostMapping("/register")
  @Operation(summary = "Register a local account when self-registration is enabled")
  @ApiResponse(
      responseCode = "200",
      description = "Registration accepted and verification email sent")
  @ApiResponse(responseCode = "400", description = "Validation failed or the Turnstile token was rejected")
  @ApiResponse(responseCode = "403", description = "Self-registration is disabled")
  @ApiResponse(responseCode = "409", description = "Email already exists")
  @ApiResponse(responseCode = "503", description = "Turnstile verification is temporarily unavailable")
  public ResponseEntity<RegisterResponse> register(
      @Valid @RequestBody RegisterRequest request, HttpServletRequest servletRequest) {
    return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(authService.register(
        request, servletRequest.getRemoteAddr(), servletRequest.getHeader(HttpHeaders.USER_AGENT)));
  }

  @PostMapping("/registration/verify")
  @Operation(summary = "Verify a registration email using a six digit OTP")
  @ApiResponse(responseCode = "200", description = "Email verified, including repeated success")
  @ApiResponse(responseCode = "400", description = "Invalid session or incorrect/expired code")
  @ApiResponse(responseCode = "429", description = "Attempt or rate limit reached")
  public AuthMessageResponse verifyRegistration(@Valid @RequestBody VerifyRegistrationRequest request,
      HttpServletRequest servletRequest) {
    return registrationVerificationService.verify(request, servletRequest.getRemoteAddr());
  }

  @PostMapping("/registration/resend")
  @Operation(summary = "Resend a registration OTP using its scoped session")
  @ApiResponse(responseCode = "200", description = "New code queued; old code invalidated")
  @ApiResponse(responseCode = "400", description = "Invalid or expired registration session")
  @ApiResponse(responseCode = "429", description = "Cooldown or rate limit reached")
  public ResponseEntity<RegistrationChallengeResponse> resendRegistration(@Valid @RequestBody RegistrationSessionRequest request,
      HttpServletRequest servletRequest) {
    return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(
        registrationVerificationService.resend(request, servletRequest.getRemoteAddr()));
  }

  @PostMapping("/registration/email")
  @Operation(summary = "Correct a pending registration email and send a new OTP")
  @ApiResponse(responseCode = "200", description = "Email corrected; old codes and links revoked")
  @ApiResponse(responseCode = "400", description = "Invalid registration session or email")
  @ApiResponse(responseCode = "409", description = "Email taken or account already active")
  @ApiResponse(responseCode = "429", description = "Rate limit reached")
  public ResponseEntity<RegistrationChallengeResponse> changeRegistrationEmail(@Valid @RequestBody ChangeRegistrationEmailRequest request,
      HttpServletRequest servletRequest) {
    return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(
        registrationVerificationService.changeEmail(request, servletRequest.getRemoteAddr()));
  }

  @PostMapping("/registration/resume")
  @Operation(summary = "Resume pending verification with email/username and password")
  @ApiResponse(responseCode = "200", description = "New registration session and OTP issued")
  @ApiResponse(responseCode = "401", description = "Invalid credentials")
  @ApiResponse(responseCode = "409", description = "Account already verified")
  @ApiResponse(responseCode = "429", description = "Cooldown or rate limit reached")
  public ResponseEntity<RegistrationChallengeResponse> resumeRegistration(@Valid @RequestBody LoginRequest request,
      HttpServletRequest servletRequest) {
    return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(
        registrationVerificationService.resume(request, servletRequest.getRemoteAddr()));
  }

  @PostMapping("/login")
  @Operation(summary = "Login with email or username and password")
  @ApiResponse(responseCode = "200", description = "Authenticated and refresh cookie set")
  @ApiResponse(responseCode = "400", description = "Invalid request or Turnstile verification rejected")
  @ApiResponse(responseCode = "401", description = "Invalid credentials")
  @ApiResponse(responseCode = "503", description = "Turnstile verification unavailable; retry with a fresh token")
  public ResponseEntity<LoginResponse> login(
      @Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
    var result =
        authService.login(
            request,
            servletRequest.getRemoteAddr(),
            servletRequest.getHeader(HttpHeaders.USER_AGENT));
    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, refreshCookie(result.refreshToken()).toString())
        .body(result.response());
  }

  @PostMapping("/refresh")
  @Operation(summary = "Refresh access token")
  @ApiResponse(
      responseCode = "200",
      description = "Access token refreshed and refresh cookie rotated")
  @ApiResponse(responseCode = "401", description = "Refresh token missing, invalid, or expired")
  public ResponseEntity<RefreshAccessTokenResponse> refresh(HttpServletRequest request) {
    var result =
        authService.refresh(
            cookieValue(request),
            request.getRemoteAddr(),
            request.getHeader(HttpHeaders.USER_AGENT));
    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, refreshCookie(result.refreshToken()).toString())
        .body(result.response());
  }

  @PostMapping("/verify-email")
  @Operation(summary = "Verify account email")
  @ApiResponse(responseCode = "200", description = "Email verified")
  @ApiResponse(responseCode = "400", description = "Token missing, invalid, or expired")
  public AuthMessageResponse verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
    return authService.verifyEmail(request);
  }

  @PostMapping("/password/forgot")
  @Operation(summary = "Request a password reset email")
  @ApiResponse(responseCode = "200", description = "Request accepted")
  @ApiResponse(responseCode = "400", description = "Validation failed or the Turnstile token was rejected")
  @ApiResponse(responseCode = "503", description = "Turnstile verification is temporarily unavailable")
  public AuthMessageResponse forgotPassword(
      @Valid @RequestBody ForgotPasswordRequest request, HttpServletRequest servletRequest) {
    return authService.forgotPassword(
        request, servletRequest.getRemoteAddr(), servletRequest.getHeader(HttpHeaders.USER_AGENT));
  }

  @PostMapping("/password/reset")
  @Operation(summary = "Reset password using a one-time token")
  @ApiResponse(responseCode = "200", description = "Password reset")
  @ApiResponse(responseCode = "400", description = "Token missing, invalid, or expired")
  public AuthMessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
    return authService.resetPassword(request);
  }

  @PostMapping("/password/change")
  @Operation(summary = "Change password for currently authenticated user")
  @ApiResponse(responseCode = "200", description = "Password changed successfully")
  @ApiResponse(responseCode = "400", description = "Current password incorrect or validation error")
  @ApiResponse(responseCode = "401", description = "Authentication required")
  public AuthMessageResponse changePassword(@Valid @RequestBody ChangePasswordRequest request) {
    return authService.changePassword(request);
  }

  @PostMapping("/logout")
  @Operation(summary = "Logout and revoke refresh token")
  @ApiResponse(responseCode = "204", description = "Refresh token revoked and cookie cleared")
  public ResponseEntity<Void> logout(HttpServletRequest request) {
    refreshTokenService.revoke(cookieValue(request));
    return ResponseEntity.noContent()
        .header(HttpHeaders.SET_COOKIE, clearCookie().toString())
        .build();
  }

  private String cookieValue(HttpServletRequest request) {
    var cookies = request.getCookies();
    if (cookies == null) {
      return null;
    }
    for (Cookie cookie : cookies) {
      if (REFRESH_COOKIE.equals(cookie.getName())) {
        return cookie.getValue();
      }
    }
    return null;
  }

  private ResponseCookie refreshCookie(RefreshTokenIssue token) {
    return ResponseCookie.from(REFRESH_COOKIE, token.token())
        .httpOnly(true)
        .secure(securityProperties.cookie().secure())
        .sameSite(securityProperties.cookie().sameSite())
        .path("/api/v1/auth")
        .maxAge(token.maxAgeSeconds())
        .build();
  }

  private ResponseCookie clearCookie() {
    return ResponseCookie.from(REFRESH_COOKIE, "")
        .httpOnly(true)
        .secure(securityProperties.cookie().secure())
        .sameSite(securityProperties.cookie().sameSite())
        .path("/api/v1/auth")
        .maxAge(0)
        .build();
  }
}
