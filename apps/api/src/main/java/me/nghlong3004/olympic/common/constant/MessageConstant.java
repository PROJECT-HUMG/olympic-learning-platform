package me.nghlong3004.olympic.common.constant;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/19/2026
 */
public final class MessageConstant {

  public static final String REGISTRATION_SUCCESS_MESSAGE =
      "Registration accepted. Verify your email to activate the account.";
  public static final String REGISTRATION_SUCCESS_MESSAGE_KEY = "success.auth.register";

  public static final String FORGOT_PASSWORD_MESSAGE =
      "If the email exists, reset instructions have been sent.";
  public static final String FORGOT_PASSWORD_MESSAGE_KEY = "success.auth.forgotPassword";

  public static final String EMAIL_VERIFIED_MESSAGE = "Email verified.";

  public static final String EMAIL_VERIFIED_MESSAGE_KEY = "success.auth.emailVerified";

  public static final String PASSWORD_RESET_SUCCESS_MESSAGE = "Password reset successfully.";

  public static final String PASSWORD_RESET_SUCCESS_MESSAGE_KEY = "success.auth.resetPassword";

  private MessageConstant() {}
}
