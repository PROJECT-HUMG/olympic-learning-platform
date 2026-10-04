package me.nghlong3004.olympic.daily.evidence;

import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.OffsetDateTime;
import java.util.UUID;
import me.nghlong3004.olympic.common.config.JsonNodeCompatibilityConfig;
import me.nghlong3004.olympic.common.error.GlobalExceptionHandler;
import me.nghlong3004.olympic.common.security.BearerTokenConfig;
import me.nghlong3004.olympic.common.security.JwtCurrentUserAuthenticationConverter;
import me.nghlong3004.olympic.common.security.SecurityFilterChainsConfig;
import me.nghlong3004.olympic.daily.evidence.controller.EvidenceController;
import me.nghlong3004.olympic.daily.evidence.controller.EvidencePrivacyFilter;
import me.nghlong3004.olympic.daily.evidence.dto.EvidenceDownload;
import me.nghlong3004.olympic.daily.evidence.enums.EvidenceKind;
import me.nghlong3004.olympic.daily.evidence.enums.EvidenceStage;
import me.nghlong3004.olympic.daily.evidence.request.CreateEvidenceLinkRequest;
import me.nghlong3004.olympic.daily.evidence.response.EvidenceMetadataResponse;
import me.nghlong3004.olympic.daily.evidence.service.EvidenceService;
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
 * Exact wire/security proof; mocked service is not persistence or production JWT proof.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@WebMvcTest(EvidenceController.class)
@Import({SecurityFilterChainsConfig.class, BearerTokenConfig.class,
    JwtCurrentUserAuthenticationConverter.class, GlobalExceptionHandler.class,
    JsonNodeCompatibilityConfig.class, EvidencePrivacyFilter.class})
@TestPropertySource(properties = {
    "spring.security.oauth2.client.registration.google.client-id=test",
    "spring.security.oauth2.client.registration.google.client-secret=test",
    "spring.security.oauth2.client.registration.github.client-id=test",
    "spring.security.oauth2.client.registration.github.client-secret=test"})
class EvidenceControllerTest {
  private static final UUID OWNER = UUID.fromString("00000000-0000-0000-0000-00000000e101");
  private static final UUID PLAN = UUID.fromString("00000000-0000-0000-0000-00000000e102");
  private static final UUID TASK = UUID.fromString("00000000-0000-0000-0000-00000000e103");
  private static final UUID ITEM = UUID.fromString("00000000-0000-0000-0000-00000000e104");
  private static final OffsetDateTime CREATED = OffsetDateTime.parse("2026-10-04T12:00:00Z");
  private static final String ROOT = "/api/v1/daily/plans/" + PLAN + "/tasks/" + TASK + "/evidence";
  @Autowired private MockMvc mvc;
  @MockitoBean private EvidenceService service;
  @MockitoBean private JwtDecoder decoder;
  @MockitoBean private CorsConfigurationSource corsConfigurationSource;

  @BeforeEach
  void token() {
    when(decoder.decode("owner-token")).thenReturn(Jwt.withTokenValue("owner-token")
        .header("alg", "HS256").subject(OWNER.toString()).claim("email", "owner@test.invalid")
        .claim("username", "owner").claim("full-name", "Owner").claim("role", "STUDENT")
        .claim("status", "ACTIVE").build());
  }

  @Test
  void fileCreationReturns201OneCompleteRecordIncludingNulls() throws Exception {
    when(service.createFile(eq(PLAN), eq(TASK), eq(EvidenceStage.START), any())).thenReturn(
        new EvidenceMetadataResponse(ITEM, PLAN, TASK, EvidenceStage.START, EvidenceKind.FILE,
            "notes.txt", "text/plain", 3L, null, null, CREATED));
    mvc.perform(multipart(ROOT).file(new MockMultipartFile("file", "notes.txt", "text/plain", new byte[]{1, 2, 3}))
            .param("stage", "START").header("Authorization", "Bearer owner-token"))
        .andExpect(status().isCreated()).andExpect(header().string("Cache-Control", "no-store"))
        .andExpect(jsonPath("$").isMap()).andExpect(jsonPath("$.length()").value(11))
        .andExpect(jsonPath("$.id").value(ITEM.toString())).andExpect(jsonPath("$.planId").value(PLAN.toString()))
        .andExpect(jsonPath("$.taskId").value(TASK.toString())).andExpect(jsonPath("$.stage").value("START"))
        .andExpect(jsonPath("$.kind").value("FILE")).andExpect(jsonPath("$.originalName").value("notes.txt"))
        .andExpect(jsonPath("$.contentType").value("text/plain")).andExpect(jsonPath("$.sizeBytes").value(3))
        .andExpect(jsonPath("$.url").value(nullValue())).andExpect(jsonPath("$.label").value(nullValue()))
        .andExpect(jsonPath("$.createdAt").value("2026-10-04T12:00:00Z"));
  }

  @Test
  void linkCreationReturns201OneCompleteRecordIncludingNulls() throws Exception {
    var request = new CreateEvidenceLinkRequest(EvidenceStage.FINISH, "https://example.org/work", "Work notes");
    when(service.createLink(PLAN, TASK, request)).thenReturn(new EvidenceMetadataResponse(
        ITEM, PLAN, TASK, EvidenceStage.FINISH, EvidenceKind.LINK, null, null, null,
        request.url(), request.label(), CREATED));
    mvc.perform(post(ROOT + "/links").header("Authorization", "Bearer owner-token")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"stage\":\"FINISH\",\"url\":\"https://example.org/work\",\"label\":\"Work notes\"}"))
        .andExpect(status().isCreated()).andExpect(header().string("Cache-Control", "no-store"))
        .andExpect(jsonPath("$").isMap()).andExpect(jsonPath("$.length()").value(11))
        .andExpect(jsonPath("$.id").value(ITEM.toString())).andExpect(jsonPath("$.planId").value(PLAN.toString()))
        .andExpect(jsonPath("$.taskId").value(TASK.toString())).andExpect(jsonPath("$.stage").value("FINISH"))
        .andExpect(jsonPath("$.kind").value("LINK")).andExpect(jsonPath("$.originalName").value(nullValue()))
        .andExpect(jsonPath("$.contentType").value(nullValue())).andExpect(jsonPath("$.sizeBytes").value(nullValue()))
        .andExpect(jsonPath("$.url").value(request.url())).andExpect(jsonPath("$.label").value(request.label()))
        .andExpect(jsonPath("$.createdAt").value("2026-10-04T12:00:00Z"));
  }

  @Test
  void anonymousEvidenceDoesNotReachServiceAndIsNotCached() throws Exception {
    mvc.perform(get(ROOT)).andExpect(status().isUnauthorized()).andExpect(header().string("Cache-Control", "no-store"));
    mvc.perform(get(ROOT + "/" + ITEM + "/bytes")).andExpect(status().isUnauthorized());
    mvc.perform(post(ROOT + "/links").contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isUnauthorized());
    verifyNoInteractions(service);
  }

  @Test
  void bytesUseAuthenticatedAttachmentNotDeclaredMime() throws Exception {
    var data = new byte[]{1, 2, 3};
    when(service.download(PLAN, TASK, ITEM, null)).thenReturn(new EvidenceDownload("notes.svg", data));
    mvc.perform(get(ROOT + "/" + ITEM + "/bytes").header("Authorization", "Bearer owner-token"))
        .andExpect(status().isOk()).andExpect(content().bytes(data))
        .andExpect(content().contentType(MediaType.APPLICATION_OCTET_STREAM))
        .andExpect(header().string("Cache-Control", "no-store"))
        .andExpect(header().string("X-Content-Type-Options", "nosniff"))
        .andExpect(header().string("Content-Disposition", startsWith("attachment;")));
  }

  @Test
  void deleteHas204EmptyBody() throws Exception {
    mvc.perform(delete(ROOT + "/" + ITEM).header("Authorization", "Bearer owner-token"))
        .andExpect(status().isNoContent()).andExpect(content().string(""));
    verify(service).remove(PLAN, TASK, ITEM);
  }

  @Test
  void invalidLinkAndStageDoNotReachService() throws Exception {
    mvc.perform(post(ROOT + "/links").header("Authorization", "Bearer owner-token")
        .contentType(MediaType.APPLICATION_JSON).content("{\"stage\":\"START\",\"url\":\"\",\"label\":\"\"}"))
        .andExpect(status().isBadRequest()).andExpect(header().string("Cache-Control", "no-store"));
    mvc.perform(multipart(ROOT).file(new MockMultipartFile("file", "a", "text/plain", new byte[]{1}))
        .param("stage", "OTHER").header("Authorization", "Bearer owner-token"))
        .andExpect(status().isBadRequest());
    verifyNoInteractions(service);
  }
}
