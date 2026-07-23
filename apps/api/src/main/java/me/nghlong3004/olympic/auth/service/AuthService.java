package me.nghlong3004.olympic.auth.service;

import me.nghlong3004.olympic.auth.dto.RefreshTokenIssue;
import me.nghlong3004.olympic.auth.request.ChangePasswordRequest;
import me.nghlong3004.olympic.auth.request.ForgotPasswordRequest;
import me.nghlong3004.olympic.auth.request.LoginRequest;
import me.nghlong3004.olympic.auth.request.RegisterRequest;
import me.nghlong3004.olympic.auth.request.ResetPasswordRequest;
import me.nghlong3004.olympic.auth.request.VerifyEmailRequest;
import me.nghlong3004.olympic.auth.response.*;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/15/2026
 */
public interface AuthService {

  /**
   * Registers a local user when self-registration is enabled. The created account remains pending
   * until the verification email token is consumed.
   *
   * @param request validated registration payload
   * @param ip client IP address for email-token audit metadata
   * @param userAgent client user-agent for email-token audit metadata
   * @return pending account response
   */
  RegisterResponse register(RegisterRequest request, String ip, String userAgent);

  /**
   * Authenticates a local email/password user and issues a bearer access token plus a refresh token
   * cookie payload. The implementation must never log the plaintext password.
   *
   * @param request validated login credentials
   * @param ip client IP address for refresh-token audit metadata
   * @param userAgent client user-agent for refresh-token audit metadata
   * @return access-token response and refresh-token issue details
   */
  LoginResult login(LoginRequest request, String ip, String userAgent);

  /**
   * Rotates a refresh token and issues a new access token. Invalid, expired, or reused refresh
   * tokens must fail with stable auth error codes.
   *
   * @param refreshToken raw refresh token from the HttpOnly cookie
   * @param ip client IP address for refresh-token audit metadata
   * @param userAgent client user-agent for refresh-token audit metadata
   * @return new access-token response and rotated refresh-token details
   */
  RefreshResult refresh(String refreshToken, String ip, String userAgent);

  /**
   * Activates a pending user by consuming a one-time email verification token.
   *
   * @param request verification token payload
   * @return generic success response
   */
  AuthMessageResponse verifyEmail(VerifyEmailRequest request);

  /**
   * Starts a password reset flow. The response is intentionally generic for both existing and
   * missing emails to avoid account enumeration.
   *
   * @param request email payload
   * @param ip client IP address for email-token audit metadata
   * @param userAgent client user-agent for email-token audit metadata
   * @return generic accepted response
   */
  AuthMessageResponse forgotPassword(ForgotPasswordRequest request, String ip, String userAgent);

  /**
   * Resets a password by consuming a one-time password reset or admin invite token. Existing
   * refresh tokens for the user are revoked after the password changes.
   *
   * @param request reset token and new password payload
   * @return generic success response
   */
  AuthMessageResponse resetPassword(ResetPasswordRequest request);

  /**
   * Changes the password of the currently authenticated user after verifying their current password.
   *
   * @param request current password and new password payload
   * @return generic success response
   */
  AuthMessageResponse changePassword(ChangePasswordRequest request);

  record LoginResult(LoginResponse response, RefreshTokenIssue refreshToken) {}

  record RefreshResult(RefreshAccessTokenResponse response, RefreshTokenIssue refreshToken) {}
}
