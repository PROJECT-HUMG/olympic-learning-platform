package me.nghlong3004.olympic.exam;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import me.nghlong3004.olympic.common.config.JsonNodeCompatibilityConfig;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.error.GlobalExceptionHandler;
import me.nghlong3004.olympic.common.security.BearerTokenConfig;
import me.nghlong3004.olympic.common.security.JwtCurrentUserAuthenticationConverter;
import me.nghlong3004.olympic.common.security.SecurityFilterChainsConfig;
import me.nghlong3004.olympic.exam.controller.ExamController;
import me.nghlong3004.olympic.exam.dto.ExamFigureDownload;
import me.nghlong3004.olympic.exam.response.ExamPaperSummaryResponse;
import me.nghlong3004.olympic.exam.response.StudentExamItemResponse;
import me.nghlong3004.olympic.exam.response.StudentExamPaperResponse;
import me.nghlong3004.olympic.exam.service.ExamService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Real API security chain for exam routes. Released JSON is the controller projection of the
 * service result. Database release, deletion, and disabled-user checks stay in the PostgreSQL fixture.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@WebMvcTest(ExamController.class)
@Import({
  SecurityFilterChainsConfig.class,
  BearerTokenConfig.class,
  JwtCurrentUserAuthenticationConverter.class,
  GlobalExceptionHandler.class,
  JsonNodeCompatibilityConfig.class
})
@TestPropertySource(properties = {
  "spring.security.oauth2.client.registration.google.client-id=test",
  "spring.security.oauth2.client.registration.google.client-secret=test",
  "spring.security.oauth2.client.registration.github.client-id=test",
  "spring.security.oauth2.client.registration.github.client-secret=test"
})
class ExamSecurityChainTest {
  private static final UUID STUDENT = UUID.fromString("00000000-0000-0000-0000-000000000701");
  private static final UUID EXAM = UUID.fromString("00000000-0000-0000-0000-000000000702");
  private static final UUID PAPER = UUID.fromString("00000000-0000-0000-0000-000000000703");
  private static final UUID SUBJECT = UUID.fromString("00000000-0000-0000-0000-000000000704");
  private static final UUID QUESTION = UUID.fromString("00000000-0000-0000-0000-000000000705");
  private static final UUID FIGURE = UUID.fromString("00000000-0000-0000-0000-000000000706");
  private static final OffsetDateTime RELEASE = OffsetDateTime.parse("2026-10-04T12:00:00Z");

  @Autowired private MockMvc mvc;
  @MockitoBean private ExamService examService;
  @MockitoBean private JwtDecoder decoder;
  @MockitoBean private CorsConfigurationSource corsConfigurationSource;

  @BeforeEach
  void tokens() {
    when(decoder.decode("student-token")).thenReturn(token("student-token", STUDENT, "STUDENT"));
  }

  @Test
  void anonymousExamRoutesAreNotPublic() throws Exception {
    mvc.perform(get("/api/v1/exams")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/exams/papers")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/exams/papers/{paperId}", PAPER)).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/exams/papers/{paperId}/figures/{assetId}", PAPER, FIGURE))
        .andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/exams/{examId}", EXAM)).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/v1/exams").contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isUnauthorized());
    mvc.perform(post("/api/v1/exams/{examId}/publish", EXAM)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"expectedVersion\":0}"))
        .andExpect(status().isUnauthorized());
    verifyNoInteractions(examService);
  }

  @Test
  void studentBearerReachesReleasedReadWithoutSolutionKeys() throws Exception {
    var content = JsonNodeFactory.instance.objectNode().put("schemaVersion", 1);
    content.putArray("stem").addObject().put("id", "s").put("kind", "text").put("source", "Hot plate");
    when(examService.listPapers()).thenReturn(List.of(new ExamPaperSummaryResponse(
        PAPER, EXAM, 1, "Heat", SUBJECT, RELEASE, RELEASE, new BigDecimal("2.50"))));
    when(examService.getPaper(PAPER, true)).thenReturn(new StudentExamPaperResponse(
        PAPER, EXAM, 1, "Heat", SUBJECT, "Show the working", RELEASE, RELEASE, new BigDecimal("2.50"),
        List.of(new StudentExamItemResponse(
            QUESTION, new BigDecimal("2.50"), Map.of("p", new BigDecimal("2.50")), "Keep units", content))));
    when(examService.downloadFigure(PAPER, FIGURE))
        .thenReturn(new ExamFigureDownload("stem.png", "image/png", new byte[] {1, 2, 3}));
    when(examService.listDrafts()).thenThrow(ErrorCode.ACCESS_DENIED.throwIt());

    mvc.perform(get("/api/v1/exams/papers").header("Authorization", "Bearer student-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(PAPER.toString()))
        .andExpect(jsonPath("$[0].versionNumber").value(1))
        .andExpect(jsonPath("$[0].items").doesNotExist());
    mvc.perform(get("/api/v1/exams/papers/{paperId}", PAPER)
            .param("solutions", "true")
            .header("Authorization", "Bearer student-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].content.schemaVersion").value(1))
        .andExpect(jsonPath("$.items[0].content.stem[0].source").value("Hot plate"))
        .andExpect(jsonPath("$.items[0].answer").doesNotExist())
        .andExpect(jsonPath("$.items[0].explanation").doesNotExist());
    mvc.perform(get("/api/v1/exams/papers/{paperId}/figures/{assetId}", PAPER, FIGURE)
            .header("Authorization", "Bearer student-token"))
        .andExpect(status().isOk())
        .andExpect(header().string("Cache-Control", "no-store"))
        .andExpect(header().string("X-Content-Type-Options", "nosniff"))
        .andExpect(header().string("Content-Type", "image/png"));
    mvc.perform(get("/api/v1/exams").header("Authorization", "Bearer student-token"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    verify(examService).getPaper(PAPER, true);
  }

  private static Jwt token(String value, UUID id, String role) {
    return Jwt.withTokenValue(value)
        .header("alg", "HS256")
        .subject(id.toString())
        .claim("email", "person@test.invalid")
        .claim("username", "person")
        .claim("full-name", "Person")
        .claim("role", role)
        .claim("status", "ACTIVE")
        .build();
  }
}
