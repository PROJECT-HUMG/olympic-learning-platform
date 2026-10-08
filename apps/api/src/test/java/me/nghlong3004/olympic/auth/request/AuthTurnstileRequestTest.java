package me.nghlong3004.olympic.auth.request;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
class AuthTurnstileRequestTest {

  private final ObjectMapper objectMapper = new ObjectMapper();
  private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

  @Test
  void loginSupportsOldPayloadsAndBoundsOptionalTokens() throws Exception {
    var old = new LoginRequest("student", "synthetic-password");
    assertThat(old.turnstileToken()).isNull();
    assertThat(validator.validate(old)).isEmpty();
    var parsed = objectMapper.readValue(
        """
        {"identifier":"student","password":"synthetic-password","turnstileToken":"sample-token"}
        """, LoginRequest.class);
    assertThat(parsed.turnstileToken()).isEqualTo("sample-token");
    var without = objectMapper.readValue(
        """
        {"identifier":"student","password":"synthetic-password"}
        """, LoginRequest.class);
    assertThat(without.turnstileToken()).isNull();
    assertThat(validator.validate(new LoginRequest("student", "synthetic-password", "a".repeat(2048))))
        .isEmpty();
    assertThat(validator.validate(new LoginRequest("student", "synthetic-password", "a".repeat(2049))))
        .anyMatch(violation -> violation.getPropertyPath().toString().equals("turnstileToken"));
  }

  @Test
  void oldConstructorsRemainAndOmitTheToken() {
    var register = new RegisterRequest("user@example.com", "user", "Student", "ChangeMe@123");
    var forgot = new ForgotPasswordRequest("user@example.com");

    assertThat(register.turnstileToken()).isNull();
    assertThat(forgot.turnstileToken()).isNull();
    assertThat(validator.validate(register)).isEmpty();
    assertThat(validator.validate(forgot)).isEmpty();
  }

  @Test
  void tokenIsOptionalAndAtMost2048Characters() throws Exception {
    var token = "a".repeat(2048);
    var register =
        new RegisterRequest("user@example.com", "user", "Student", "ChangeMe@123", token);
    var forgot = new ForgotPasswordRequest("user@example.com", token);

    assertThat(validator.validate(register)).isEmpty();
    assertThat(validator.validate(forgot)).isEmpty();
    assertThat(validator.validate(new RegisterRequest(
            "user@example.com", "user", "Student", "ChangeMe@123", "a".repeat(2049))))
        .anyMatch(violation -> violation.getPropertyPath().toString().equals("turnstileToken"));
    assertThat(validator.validate(new ForgotPasswordRequest("user@example.com", "a".repeat(2049))))
        .anyMatch(violation -> violation.getPropertyPath().toString().equals("turnstileToken"));

    var parsedRegister =
        objectMapper.readValue(
            """
            {"email":"user@example.com","username":"user","fullName":"Student","password":"ChangeMe@123","turnstileToken":"sample-token"}
            """,
            RegisterRequest.class);
    var parsedWithoutToken =
        objectMapper.readValue(
            """
            {"email":"user@example.com","username":"user","fullName":"Student","password":"ChangeMe@123"}
            """,
            RegisterRequest.class);
    var parsedForgot =
        objectMapper.readValue(
            """
            {"email":"user@example.com","turnstileToken":"sample-token"}
            """,
            ForgotPasswordRequest.class);

    assertThat(parsedRegister.turnstileToken()).isEqualTo("sample-token");
    assertThat(parsedWithoutToken.turnstileToken()).isNull();
    assertThat(parsedForgot.turnstileToken()).isEqualTo("sample-token");
    assertThat(parsedForgot.email()).isEqualTo("user@example.com");
  }
}
