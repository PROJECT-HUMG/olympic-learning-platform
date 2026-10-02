package me.nghlong3004.olympic.auth.service;

import me.nghlong3004.olympic.auth.request.ChangeRegistrationEmailRequest;
import me.nghlong3004.olympic.auth.request.LoginRequest;
import me.nghlong3004.olympic.auth.request.RegistrationSessionRequest;
import me.nghlong3004.olympic.auth.request.VerifyRegistrationRequest;
import me.nghlong3004.olympic.auth.response.AuthMessageResponse;
import me.nghlong3004.olympic.auth.response.RegistrationChallengeResponse;
import me.nghlong3004.olympic.user.entity.User;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
public interface RegistrationVerificationService {
  /**
   * Issues the first OTP inside the registration transaction. Sends mail only after commit.
   * @param user newly created pending local account
   * @param ip trusted client address for shared rate limits
   * @return scoped session and verification deadlines
   */
  RegistrationChallengeResponse start(User user, String ip);
  /**
   * Proves password knowledge before rotating a pending account's registration session.
   * @param request pending account credentials; never logged
   * @param ip trusted client address
   * @return replacement session and code deadlines
   */
  RegistrationChallengeResponse resume(LoginRequest request, String ip);
  /**
   * Sends a new OTP after enforcing cooldown and shared limits; revokes the previous code.
   * @param request secret scoped session
   * @param ip trusted client address
   * @return current session and replacement code deadlines
   */
  RegistrationChallengeResponse resend(RegistrationSessionRequest request, String ip);
  /**
   * Changes only the pending account authorized by the opaque session and revokes old tokens.
   * @param request scoped session and corrected email
   * @param ip trusted client address
   * @return corrected address and new code deadlines
   */
  RegistrationChallengeResponse changeEmail(ChangeRegistrationEmailRequest request, String ip);
  /**
   * Activates the account after OTP validation; failed attempts survive error responses.
   * @param request scoped session and six digit code
   * @param ip trusted client address
   * @return verification success, also for repeated requests after activation
   */
  AuthMessageResponse verify(VerifyRegistrationRequest request, String ip);
}
