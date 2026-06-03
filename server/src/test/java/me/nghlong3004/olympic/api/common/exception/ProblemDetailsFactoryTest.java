package me.nghlong3004.olympic.api.common.exception;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

/**
 * @author nghlong3004 (Nguyen Hoang Long)
 * @since 6/3/2026
 */
class ProblemDetailsFactoryTest {

  private final ProblemDetailsFactory factory =
      new ProblemDetailsFactory("http://localhost:8080/api/v1/problems");

  @Test
  void create_ErrorCode_ReturnsProblemDetailsShape() {
    // Arrange
    var request = new MockHttpServletRequest("GET", "/api/v1/questions");
    request.addHeader("X-Trace-Id", "trace-123");

    // Act
    var response = factory.create(request, ErrorCode.RESOURCE_NOT_FOUND);

    // Assert
    assertThat(response)
        .extracting(
            ProblemDetailsResponse::type,
            ProblemDetailsResponse::title,
            ProblemDetailsResponse::status,
            ProblemDetailsResponse::detail,
            ProblemDetailsResponse::instance,
            ProblemDetailsResponse::code,
            ProblemDetailsResponse::traceId)
        .containsExactly(
            "http://localhost:8080/api/v1/problems/resource-not-found",
            "Resource Not Found",
            404,
            "Resource not found.",
            "/api/v1/questions",
            "RESOURCE_NOT_FOUND",
            "trace-123");
  }

  @Test
  void create_FieldErrors_IncludesErrorsArray() {
    // Arrange
    var request = new MockHttpServletRequest("POST", "/api/v1/questions");
    var errors = List.of(new ProblemFieldError("content", "must not be blank"));

    // Act
    var response = factory.create(request, ErrorCode.VALIDATION_ERROR, errors);

    // Assert
    assertThat(response.errors())
        .containsExactly(new ProblemFieldError("content", "must not be blank"));
  }
}
