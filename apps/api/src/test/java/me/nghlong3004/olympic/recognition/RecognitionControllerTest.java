package me.nghlong3004.olympic.recognition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.recognition.response.RecognitionProfileResponse;
import me.nghlong3004.olympic.user.controller.UserController;
import me.nghlong3004.olympic.user.service.UserService;
import me.nghlong3004.olympic.user.response.PublicUserIdentityResponse;
import me.nghlong3004.olympic.common.security.BearerTokenConfig;
import me.nghlong3004.olympic.common.security.JwtCurrentUserAuthenticationConverter;
import me.nghlong3004.olympic.common.security.SecurityFilterChainsConfig;
import me.nghlong3004.olympic.recognition.controller.AdminRecognitionController;
import me.nghlong3004.olympic.recognition.controller.RecognitionController;
import me.nghlong3004.olympic.recognition.controller.RecognitionInputExceptionHandler;
import me.nghlong3004.olympic.recognition.dto.RecognitionDownload;
import me.nghlong3004.olympic.recognition.enums.AchievementStatus;
import me.nghlong3004.olympic.recognition.request.ReviewAchievementRequest;
import me.nghlong3004.olympic.recognition.request.SubmitAchievementRequest;
import me.nghlong3004.olympic.recognition.response.RankingResponse;
import me.nghlong3004.olympic.recognition.response.RecognitionProfileResponse;
import me.nghlong3004.olympic.user.controller.UserController;
import me.nghlong3004.olympic.user.service.UserService;
import me.nghlong3004.olympic.user.response.PublicUserIdentityResponse;
import me.nghlong3004.olympic.recognition.service.RecognitionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
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
 * @since 10/02/2026
 */
@WebMvcTest({RecognitionController.class, AdminRecognitionController.class, UserController.class})
@Import({SecurityFilterChainsConfig.class, BearerTokenConfig.class,
    JwtCurrentUserAuthenticationConverter.class, RecognitionInputExceptionHandler.class})
@TestPropertySource(properties = {
    "spring.security.oauth2.client.registration.google.client-id=test",
    "spring.security.oauth2.client.registration.google.client-secret=test",
    "spring.security.oauth2.client.registration.github.client-id=test",
    "spring.security.oauth2.client.registration.github.client-secret=test"
})
class RecognitionControllerTest {
  private static final UUID ID = UUID.fromString("00000000-0000-0000-0000-000000009001");
  private static final UUID FILE = UUID.fromString("00000000-0000-0000-0000-000000009002");
  private static final String METADATA = """
      {"title":"Academic award","category":"OLYMPIC_NATIONAL","award":"FIRST",
       "includeParticipation":true,"achievedDate":"2000-01-01","publicVisible":false}
      """;
  @Autowired private MockMvc mvc;
  @MockitoBean private RecognitionService service;
  @MockitoBean private UserService userService;
  @MockitoBean private JwtDecoder decoder;
  @MockitoBean private CorsConfigurationSource cors;

  @BeforeEach
  void tokenRoles() {
    when(decoder.decode("student-token")).thenReturn(token("student-token", "STUDENT"));
    when(decoder.decode("admin-token")).thenReturn(token("admin-token", "ADMIN"));
  }

  @Test
  void legacyAuthenticatedUserLookupAlsoReturnsOnlyMinimalPublicIdentity() throws Exception {
    when(userService.findById(ID)).thenReturn(new PublicUserIdentityResponse(ID, "Synthetic member", "member", null, null, true));
    mvc.perform(get("/api/v1/users/{id}", ID)).andExpect(status().isUnauthorized());
    for (String token : List.of("student-token", "admin-token")) {
      mvc.perform(get("/api/v1/users/{id}", ID).header("Authorization", "Bearer " + token))
          .andExpect(status().isOk()).andExpect(jsonPath("$.username").value("member"))
          .andExpect(jsonPath("$.email").doesNotExist()).andExpect(jsonPath("$.status").doesNotExist())
          .andExpect(jsonPath("$.lastLoginAt").doesNotExist()).andExpect(jsonPath("$.role").doesNotExist());
    }
  }

  @Test
  void profileIsPublicMinimalAndNotStoredForAnonymousOwnerOtherUserAndAdmin() throws Exception {
    when(service.profile(ID)).thenReturn(new RecognitionProfileResponse(ID, "Synthetic member", "member",
        null, null, false, 0, List.of()));
    mvc.perform(get("/api/v1/recognition/profiles/{id}", ID)).andExpect(status().isOk())
        .andExpect(header().string("Cache-Control", "no-store"))
        .andExpect(jsonPath("$.username").value("member"))
        .andExpect(jsonPath("$.email").doesNotExist()).andExpect(jsonPath("$.role").doesNotExist())
        .andExpect(jsonPath("$.lastLoginAt").doesNotExist()).andExpect(jsonPath("$.achievements").isEmpty());
    for (String token : List.of("student-token", "admin-token")) {
      mvc.perform(get("/api/v1/recognition/profiles/{id}", ID).header("Authorization", "Bearer " + token))
          .andExpect(status().isOk()).andExpect(jsonPath("$.email").doesNotExist());
    }
    mvc.perform(get("/api/v1/recognition/profiles/not-a-uuid")).andExpect(status().isBadRequest());
  }

  @Test
  void anonymousUsersCannotReadProofHistoryOrConsentOrMutateRecords() throws Exception {
    for (String path : List.of("/api/v1/recognition/achievements/me", "/api/v1/recognition/preferences/me",
        "/api/v1/recognition/achievements/" + ID + "/evidence/" + FILE,
        "/api/v1/admin/recognition/honors", "/api/v1/admin/recognition/achievements")) {
      mvc.perform(get(path)).andExpect(status().isUnauthorized());
    }
    mvc.perform(patch("/api/v1/recognition/preferences/me").contentType(MediaType.APPLICATION_JSON)
        .content("{\"rankingOptIn\":true}")).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/v1/admin/recognition/achievements/{id}/review", ID)
        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"APPROVED\",\"expectedVersion\":0}"))
        .andExpect(status().isUnauthorized());
    verifyNoInteractions(service);
  }

  @Test
  void studentsCannotUseAdminReviewOrDraftManagementRoutes() throws Exception {
    mvc.perform(get("/api/v1/admin/recognition/honors").header("Authorization", "Bearer student-token"))
        .andExpect(status().isForbidden());
    mvc.perform(post("/api/v1/admin/recognition/achievements/{id}/review", ID)
        .header("Authorization", "Bearer student-token").contentType(MediaType.APPLICATION_JSON)
        .content("{\"status\":\"APPROVED\",\"expectedVersion\":0}"))
        .andExpect(status().isForbidden());
    mvc.perform(post("/api/v1/admin/recognition/honors").header("Authorization", "Bearer student-token")
        .contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isForbidden());
    verifyNoInteractions(service);
  }

  @Test
  void anonymousPublicReadsUseOnlyPublicServiceBoundariesAndStablePageContent() throws Exception {
    when(service.listHonors(null, null, 0, 20, false)).thenReturn(Page.empty());
    when(service.rankings(2026, 0, 20)).thenReturn(new PageImpl<>(List.of(
        new RankingResponse(1, ID, "Student", "student", 16, 1, null, null))));
    when(service.profile(ID)).thenReturn(new RecognitionProfileResponse(ID, "Student", "student", null, null, true, 0, List.of()));
    mvc.perform(get("/api/v1/recognition/honors")).andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray());
    mvc.perform(get("/api/v1/recognition/rankings").param("year", "2026")).andExpect(status().isOk())
        .andExpect(jsonPath("$.content[0].rank").value(1))
        .andExpect(jsonPath("$.content[0].totalPoints").value(16));
    mvc.perform(get("/api/v1/recognition/profiles/{id}", ID)).andExpect(status().isOk())
        .andExpect(jsonPath("$.publicPoints").value(0))
        .andExpect(jsonPath("$.achievements").isEmpty());
    verify(service).listHonors(null, null, 0, 20, false);
    verify(service).profile(ID);
  }

  @Test
  void validSubmissionUsesMultipartMetadataAndPrivateEvidence() throws Exception {
    mvc.perform(multipart("/api/v1/recognition/achievements")
        .file(metadata(METADATA)).file(proof()).header("Authorization", "Bearer student-token"))
        .andExpect(status().isCreated());
    var captured = ArgumentCaptor.forClass(SubmitAchievementRequest.class);
    verify(service).submitAchievement(captured.capture(), anyList(), eq(false));
    assertThat(captured.getValue().title()).isEqualTo("Academic award");
    assertThat(captured.getValue().publicVisible()).isFalse();
    assertThat(captured.getValue().userId()).isNull();
  }

  @Test
  void invalidAndMissingMultipartDataAreClientErrorsAndNeverReachService() throws Exception {
    mvc.perform(multipart("/api/v1/recognition/achievements").file(metadata(METADATA))
        .header("Authorization", "Bearer student-token")).andExpect(status().isBadRequest());
    mvc.perform(multipart("/api/v1/recognition/achievements").file(proof())
        .header("Authorization", "Bearer student-token")).andExpect(status().isBadRequest());
    for (String metadata : List.of("{", METADATA.replace("Academic award", " "),
        METADATA.replace("2000-01-01", "9999-01-01"), METADATA.replace("OLYMPIC_NATIONAL", "UNSUPPORTED"))) {
      mvc.perform(multipart("/api/v1/recognition/achievements").file(metadata(metadata)).file(proof())
          .header("Authorization", "Bearer student-token"))
          .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
    }
    verifyNoInteractions(service);
  }

  @Test
  void adminReviewPreservesVersionAndRejectsMalformedOrIncompleteRequests() throws Exception {
    mvc.perform(post("/api/v1/admin/recognition/achievements/{id}/review", ID)
        .header("Authorization", "Bearer admin-token").contentType(MediaType.APPLICATION_JSON)
        .content("{\"status\":\"APPROVED\",\"expectedVersion\":7}"))
        .andExpect(status().isOk());
    verify(service).reviewAchievement(ID, new ReviewAchievementRequest(AchievementStatus.APPROVED, null, 7L));
    for (String invalid : List.of("{}", "{", "{\"status\":\"APPROVED\"}",
        "{\"status\":\"UNKNOWN\",\"expectedVersion\":0}")) {
      mvc.perform(post("/api/v1/admin/recognition/achievements/{id}/review", ID)
          .header("Authorization", "Bearer admin-token").contentType(MediaType.APPLICATION_JSON).content(invalid))
          .andExpect(status().isBadRequest());
    }
  }

  @Test
  void invalidPublicIdsAndAdminFiltersReturn400() throws Exception {
    mvc.perform(get("/api/v1/recognition/honors/not-a-uuid")).andExpect(status().isBadRequest());
    mvc.perform(get("/api/v1/admin/recognition/achievements").param("status", "UNKNOWN")
        .header("Authorization", "Bearer admin-token")).andExpect(status().isBadRequest());
    mvc.perform(get("/api/v1/recognition/rankings").param("year", "not-a-year"))
        .andExpect(status().isBadRequest());
    verifyNoInteractions(service);
  }

  @Test
  void privateEvidenceIsANoncacheableAttachmentAndPhotosUsePublishedBoundary() throws Exception {
    byte[] bytes = "%PDF-1.7\nproof".getBytes(StandardCharsets.US_ASCII);
    when(service.getEvidence(ID, FILE)).thenReturn(new RecognitionDownload("Giay chung nhan.pdf", "application/pdf", bytes));
    mvc.perform(get("/api/v1/recognition/achievements/{id}/evidence/{file}", ID, FILE)
        .header("Authorization", "Bearer student-token"))
        .andExpect(status().isOk()).andExpect(content().bytes(bytes))
        .andExpect(content().contentType("application/pdf"))
        .andExpect(header().string("Cache-Control", "no-store"))
        .andExpect(header().string("X-Content-Type-Options", "nosniff"))
        .andExpect(header().string("Content-Disposition", startsWith("attachment;")));
    when(service.getPhoto(ID, FILE, false)).thenReturn(new RecognitionDownload("photo.png", "image/png", new byte[] {1, 2, 3}));
    mvc.perform(get("/api/v1/recognition/honors/{id}/photos/{file}", ID, FILE))
        .andExpect(status().isOk()).andExpect(header().string("Content-Disposition", startsWith("inline;")))
        .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    verify(service).getPhoto(ID, FILE, false);
  }

  private Jwt token(String value, String role) {
    return Jwt.withTokenValue(value).header("alg", "HS256").subject(ID.toString())
        .claim("email", "student@test.invalid").claim("username", "student").claim("full-name", "Student")
        .claim("role", role).claim("status", "ACTIVE").build();
  }

  private MockMultipartFile metadata(String body) {
    return new MockMultipartFile("metadata", "metadata.json", "application/json", body.getBytes(StandardCharsets.UTF_8));
  }

  private MockMultipartFile proof() {
    return new MockMultipartFile("evidence", "certificate.png", "image/png", new byte[] {1, 2, 3});
  }
}
