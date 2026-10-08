package me.nghlong3004.olympic.auth.enums;

/**
 * Siteverify action values for the protected auth requests.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public enum TurnstileAction {
  REGISTER("register"),
  PASSWORD_RESET("password_reset"),
  LOGIN("login");

  private final String action;

  TurnstileAction(String action) {
    this.action = action;
  }

  /**
   * Exact action string returned by siteverify.
   *
   * @return {@code register}, {@code password_reset} or {@code login}
   */
  public String action() {
    return action;
  }
}
