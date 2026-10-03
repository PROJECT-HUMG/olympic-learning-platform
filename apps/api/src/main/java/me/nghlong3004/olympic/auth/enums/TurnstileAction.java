package me.nghlong3004.olympic.auth.enums;

/**
 * Siteverify action values for the two protected auth requests.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public enum TurnstileAction {
  REGISTER("register"),
  PASSWORD_RESET("password_reset");

  private final String action;

  TurnstileAction(String action) {
    this.action = action;
  }

  /**
   * Exact action string returned by siteverify.
   *
   * @return {@code register} or {@code password_reset}
   */
  public String action() {
    return action;
  }
}
