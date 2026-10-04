package me.nghlong3004.olympic.question;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.common.config.JsonNodeCompatibilityConfig;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.error.GlobalExceptionHandler;
import me.nghlong3004.olympic.common.security.BearerTokenConfig;
import me.nghlong3004.olympic.common.security.JwtCurrentUserAuthenticationConverter;
import me.nghlong3004.olympic.common.security.SecurityFilterChainsConfig;
import me.nghlong3004.olympic.question.controller.QuestionController;
import me.nghlong3004.olympic.question.dto.QuestionFigureDownload;
import me.nghlong3004.olympic.question.enums.QuestionStatus;
import me.nghlong3004.olympic.question.request.UpdateQuestionRequest;
import me.nghlong3004.olympic.question.response.QuestionFigureResponse;
import me.nghlong3004.olympic.question.response.QuestionResponse;
import me.nghlong3004.olympic.question.service.QuestionService;
import org.mockito.ArgumentCaptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@WebMvcTest(QuestionController.class)
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
class QuestionControllerTest {
  private static final UUID ID = UUID.fromString("00000000-0000-0000-0000-000000000301");
  private static final UUID FIGURE = UUID.fromString("00000000-0000-0000-0000-000000000302");

  @Autowired private MockMvc mvc;
  @MockitoBean private QuestionService service;
  @MockitoBean private JwtDecoder decoder;
  @MockitoBean private CorsConfigurationSource corsConfigurationSource;

  @BeforeEach
  void tokens() {
    when(decoder.decode("lecturer-token")).thenReturn(token("lecturer-token", "LECTURER"));
    when(decoder.decode("student-token")).thenReturn(token("student-token", "STUDENT"));
  }

  @Test
  void anonymousQuestionRoutesAreNotPublic() throws Exception {
    mvc.perform(get("/api/v1/questions")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/questions/{id}", ID)).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/v1/questions").contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/questions/{id}/figures/{figureId}", ID, FIGURE))
        .andExpect(status().isUnauthorized());
    verifyNoInteractions(service);
  }

  @Test
  void studentDoesNotReceiveQuestionOrFigureBytes() throws Exception {
    when(service.get(ID)).thenThrow(ErrorCode.ACCESS_DENIED.throwIt());
    when(service.downloadFigure(ID, FIGURE)).thenThrow(ErrorCode.ACCESS_DENIED.throwIt());
    mvc.perform(get("/api/v1/questions/{id}", ID).header("Authorization", "Bearer student-token"))
        .andExpect(status().isForbidden());
    mvc.perform(get("/api/v1/questions/{id}/figures/{figureId}", ID, FIGURE)
            .header("Authorization", "Bearer student-token"))
        .andExpect(status().isForbidden());
  }

  @Test
  void figureDownloadIsPrivateAndUploadDoesNotReturnAUrl() throws Exception {
    when(service.downloadFigure(ID, FIGURE))
        .thenReturn(new QuestionFigureDownload("plot.png", "image/png", new byte[] {1, 2, 3}));
    mvc.perform(get("/api/v1/questions/{id}/figures/{figureId}", ID, FIGURE)
            .header("Authorization", "Bearer lecturer-token"))
        .andExpect(status().isOk())
        .andExpect(header().string("Cache-Control", "no-store"))
        .andExpect(header().string("X-Content-Type-Options", "nosniff"))
        .andExpect(header().string("Content-Type", "image/png"));
    when(service.uploadFigure(eq(ID), any()))
        .thenReturn(new QuestionFigureResponse(FIGURE, "image/png", 3, "plot.png"));
    mvc.perform(multipart("/api/v1/questions/{id}/figures", ID)
            .file(new MockMultipartFile("file", "plot.png", "image/png", new byte[] {1, 2, 3}))
            .header("Authorization", "Bearer lecturer-token"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").value(FIGURE.toString()))
        .andExpect(jsonPath("$.url").doesNotExist())
        .andExpect(jsonPath("$.content").doesNotExist());
  }

  @Test
  void staffQuestionResponseExposesAuthorAndVersion() throws Exception {
    var node = JsonNodeFactory.instance.objectNode().put("schemaVersion", 1);
    when(service.get(ID)).thenReturn(new QuestionResponse(
        ID, ID, "Math", ID, "Algebra", QuestionStatus.DRAFT, "written", node, node, node,
        null, null, null, List.of(), ID, 0L));
    mvc.perform(get("/api/v1/questions/{id}", ID).header("Authorization", "Bearer lecturer-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.createdById").value(ID.toString()))
        .andExpect(jsonPath("$.version").value(0))
        .andExpect(jsonPath("$.content.schemaVersion").value(1));
  }

  @Test
  void manualPostAndPatchBindNestedSchema() throws Exception {
    String createBody = """
        {"subjectId":"%s","topicId":"%s","type":"written",
         "content":{"schemaVersion":1,"title":"Prove","structure":"SINGLE",
           "stem":[{"id":"s","kind":"text","source":"Show it"}],
           "parts":[{"id":"p","responseType":"WRITTEN","prompt":[],"options":[]}]},
         "answer":{"parts":[{"partId":"p","correctOptionIds":[]}]}}
        """.formatted(ID, ID);
    mvc.perform(post("/api/v1/questions")
            .header("Authorization", "Bearer lecturer-token")
            .contentType(MediaType.APPLICATION_JSON)
            .content(createBody))
        .andExpect(status().isCreated());
    ArgumentCaptor<UpdateQuestionRequest> created = ArgumentCaptor.forClass(UpdateQuestionRequest.class);
    verify(service).create(created.capture());
    assertNestedSchema(created.getValue(), null);

    String stripped = createBody.stripTrailing();
    String updateBody = stripped.substring(0, stripped.length() - 1) + ",\"expectedVersion\":0}";
    mvc.perform(patch("/api/v1/questions/{id}", ID)
            .header("Authorization", "Bearer lecturer-token")
            .contentType(MediaType.APPLICATION_JSON)
            .content(updateBody))
        .andExpect(status().isOk());
    ArgumentCaptor<UpdateQuestionRequest> updated = ArgumentCaptor.forClass(UpdateQuestionRequest.class);
    verify(service).update(eq(ID), updated.capture());
    assertNestedSchema(updated.getValue(), 0L);
  }

  private static void assertNestedSchema(UpdateQuestionRequest request, Long expectedVersion) {
    var version = request.content().get("schemaVersion");
    assertThat(version.isIntegralNumber()).isTrue();
    assertThat(version.asLong()).isEqualTo(1L);
    assertThat(request.content().path("stem").get(0).path("source").asText()).isEqualTo("Show it");
    assertThat(request.answer().path("parts").get(0).path("partId").asText()).isEqualTo("p");
    assertThat(request.expectedVersion()).isEqualTo(expectedVersion);
  }

  private static Jwt token(String value, String role) {
    return Jwt.withTokenValue(value).header("alg", "HS256").subject(ID.toString())
        .claim("email", "person@test.invalid").claim("username", "person").claim("full-name", "Person")
        .claim("role", role).claim("status", "ACTIVE").build();
  }
}
