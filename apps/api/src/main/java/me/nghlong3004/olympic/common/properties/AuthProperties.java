package me.nghlong3004.olympic.common.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/18/2026
 */
@ConfigurationProperties(prefix = "olympic.auth")
public record AuthProperties(Registration registration, EmailToken emailToken) {

  public AuthProperties {
    if (registration == null) {
      registration = new Registration(RegistrationMode.SELF_VERIFY);
    }
    if (emailToken == null) {
      emailToken = new EmailToken(1440, 15);
    }
  }

  public record Registration(RegistrationMode mode) {

    public Registration {
      if (mode == null) {
        mode = RegistrationMode.SELF_VERIFY;
      }
    }
  }

  public record EmailToken(
      long verificationExpirationMinutes, long passwordResetExpirationMinutes) {

    public EmailToken {
      if (verificationExpirationMinutes <= 0) {
        verificationExpirationMinutes = 1440;
      }
      if (passwordResetExpirationMinutes <= 0) {
        passwordResetExpirationMinutes = 15;
      }
    }
  }

  public enum RegistrationMode {
    ADMIN_ONLY,
    SELF_VERIFY
  }
}
