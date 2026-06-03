package me.nghlong3004.olympic.api.identity.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import me.nghlong3004.olympic.api.common.exception.ProblemDetailsFactory;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;

/**
 * @author nghlong3004 (Nguyen Hoang Long)
 * @since 6/3/2026
 */
class JwtAuthenticationEntryPointTest {

  private final ObjectMapper objectMapper = new ApplicationConfig().objectMapper();
  private final JwtAuthenticationEntryPoint entryPoint =
      new JwtAuthenticationEntryPoint(
          objectMapper, new ProblemDetailsFactory("http://localhost:8080/api/v1/problems"));

  @Test
  void commence_BadCredentials_ReturnsProblemJsonUnauthorized() throws Exception {
    // Arrange
    var request = new MockHttpServletRequest("GET", "/api/v1/me");
    var response = new MockHttpServletResponse();

    // Act
    entryPoint.commence(request, response, new BadCredentialsException("Bad credentials"));

    // Assert
    assertThat(response.getStatus()).isEqualTo(401);
    assertThat(response.getContentType()).isEqualTo("application/problem+json");
    assertThat(response.getContentAsString())
        .contains("\"code\":\"UNAUTHORIZED\"")
        .contains("\"instance\":\"/api/v1/me\"");
  }

  @Test
  void commence_InvalidBearerToken_ReturnsInvalidAccessTokenCode() throws Exception {
    // Arrange
    var request = new MockHttpServletRequest("GET", "/api/v1/me");
    var response = new MockHttpServletResponse();

    // Act
    entryPoint.commence(request, response, new InvalidBearerTokenException("invalid token"));

    // Assert
    assertThat(response.getStatus()).isEqualTo(401);
    assertThat(response.getContentAsString()).contains("\"code\":\"INVALID_ACCESS_TOKEN\"");
  }
}
