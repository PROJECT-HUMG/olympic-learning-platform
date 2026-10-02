package me.nghlong3004.olympic.auth;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.OffsetDateTime;
import java.util.List;
import me.nghlong3004.olympic.auth.controller.AuthController;
import me.nghlong3004.olympic.auth.response.AuthMessageResponse;
import me.nghlong3004.olympic.auth.response.RegistrationChallengeResponse;
import me.nghlong3004.olympic.auth.service.AuthService;
import me.nghlong3004.olympic.auth.service.RegistrationVerificationService;
import me.nghlong3004.olympic.auth.service.RefreshTokenService;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.properties.SecurityProperties;
import me.nghlong3004.olympic.common.security.BearerTokenConfig;
import me.nghlong3004.olympic.common.security.JwtCurrentUserAuthenticationConverter;
import me.nghlong3004.olympic.common.security.SecurityFilterChainsConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
@WebMvcTest(AuthController.class)
@Import({SecurityFilterChainsConfig.class, BearerTokenConfig.class, JwtCurrentUserAuthenticationConverter.class})
@TestPropertySource(properties = {
    "spring.security.oauth2.client.registration.google.client-id=test",
    "spring.security.oauth2.client.registration.google.client-secret=test",
    "spring.security.oauth2.client.registration.github.client-id=test",
    "spring.security.oauth2.client.registration.github.client-secret=test"
})
class RegistrationOtpControllerTest {
  @Autowired private MockMvc mvc;
  @MockitoBean private AuthService auth;
  @MockitoBean private RegistrationVerificationService verification;
  @MockitoBean private RefreshTokenService refresh;
  @MockitoBean private SecurityProperties properties;
  @MockitoBean private JwtDecoder decoder;
  @MockitoBean private CorsConfigurationSource cors;

  @Test
  void otpEndpointsAcceptAnonymousRequestsAndSerializeChallengeTimestamps() throws Exception {
    var now = OffsetDateTime.parse("2026-10-02T00:00:00Z");
    var session = "s".repeat(64);
    var challenge = new RegistrationChallengeResponse(session, "student@example.invalid",
        now.plusMinutes(10), now.plusSeconds(60), now.plusHours(1));
    when(verification.resend(any(), eq("127.0.0.1"))).thenReturn(challenge);
    when(verification.changeEmail(any(), eq("127.0.0.1"))).thenReturn(challenge);
    when(verification.resume(any(), eq("127.0.0.1"))).thenReturn(challenge);
    when(verification.verify(any(), eq("127.0.0.1"))).thenReturn(new AuthMessageResponse("Email verified.", "success.auth.emailVerified"));
    mvc.perform(post("/api/v1/auth/registration/verify").contentType(MediaType.APPLICATION_JSON)
        .content("{\"verificationSession\":\"" + session + "\",\"code\":\"012345\"}"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.messageKey").value("success.auth.emailVerified"));
    for (var endpoint : List.of("resend", "email", "resume")) {
      var body = switch (endpoint) {
        case "resend" -> "{\"verificationSession\":\"" + session + "\"}";
        case "email" -> "{\"verificationSession\":\"" + session + "\",\"email\":\"student@example.invalid\"}";
        default -> "{\"identifier\":\"student\",\"password\":\"synthetic-fixture\"}";
      };
      mvc.perform(post("/api/v1/auth/registration/" + endpoint).contentType(MediaType.APPLICATION_JSON).content(body))
          .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store")).andExpect(jsonPath("$.verificationSession").value(session))
          .andExpect(jsonPath("$.email").value("student@example.invalid"))
          .andExpect(jsonPath("$.expiresAt").isString()).andExpect(jsonPath("$.resendAvailableAt").isString())
          .andExpect(jsonPath("$.sessionExpiresAt").isString());
    }
  }

  @Test
  void malformedCodesSessionsAndEmailsDoNotReachTheService() throws Exception {
    for (var code : List.of("12345", "abcdef", "1234567", "")) {
      mvc.perform(post("/api/v1/auth/registration/verify").contentType(MediaType.APPLICATION_JSON)
          .content("{\"verificationSession\":\"" + "s".repeat(64) + "\",\"code\":\"" + code + "\"}"))
          .andExpect(status().isBadRequest());
    }
    for (var endpoint : List.of("verify", "resend", "email", "resume")) {
      mvc.perform(post("/api/v1/auth/registration/" + endpoint).contentType(MediaType.APPLICATION_JSON).content("{}"))
          .andExpect(status().isBadRequest());
    }
    mvc.perform(post("/api/v1/auth/registration/email").contentType(MediaType.APPLICATION_JSON)
        .content("{\"verificationSession\":\"" + "s".repeat(64) + "\",\"email\":\"wrong\"}"))
        .andExpect(status().isBadRequest());
    verifyNoInteractions(verification);
  }

  @Test
  void codeLockErrorsHaveStableStatusAndMessageKey() throws Exception {
    when(verification.verify(any(), any())).thenThrow(ErrorCode.REGISTRATION_OTP_LOCKED.throwIt());
    mvc.perform(post("/api/v1/auth/registration/verify").contentType(MediaType.APPLICATION_JSON)
        .content("{\"verificationSession\":\"" + "s".repeat(64) + "\",\"code\":\"123456\"}"))
        .andExpect(status().isTooManyRequests()).andExpect(jsonPath("$.code").value("REGISTRATION_OTP_LOCKED"))
        .andExpect(jsonPath("$.messageKey").value("error.auth.registrationOtpLocked"));
  }
}
