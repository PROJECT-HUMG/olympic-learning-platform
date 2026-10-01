package me.nghlong3004.olympic.studyroom;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.common.security.BearerTokenConfig;
import me.nghlong3004.olympic.common.security.JwtCurrentUserAuthenticationConverter;
import me.nghlong3004.olympic.common.security.SecurityFilterChainsConfig;
import me.nghlong3004.olympic.studyroom.controller.StudyRoomController;
import me.nghlong3004.olympic.studyroom.enums.StudyRoomPhase;
import me.nghlong3004.olympic.studyroom.enums.StudyRoomRequestPolicy;
import me.nghlong3004.olympic.studyroom.response.StudyRoomSnapshotResponse;
import me.nghlong3004.olympic.studyroom.response.StudyRoomSummaryResponse;
import me.nghlong3004.olympic.studyroom.service.StudyRoomService;
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
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/01/2026
 */
@WebMvcTest(StudyRoomController.class)
@Import({SecurityFilterChainsConfig.class, BearerTokenConfig.class, JwtCurrentUserAuthenticationConverter.class})
@TestPropertySource(properties = {
    "spring.security.oauth2.client.registration.google.client-id=test",
    "spring.security.oauth2.client.registration.google.client-secret=test",
    "spring.security.oauth2.client.registration.github.client-id=test",
    "spring.security.oauth2.client.registration.github.client-secret=test"
})
class StudyRoomControllerTest {
  private static final UUID ID = UUID.fromString("00000000-0000-0000-0000-000000002001");
  @Autowired private MockMvc mvc;
  @MockitoBean private StudyRoomService service;
  @MockitoBean private JwtDecoder decoder;
  @MockitoBean private CorsConfigurationSource corsConfigurationSource;

  @BeforeEach
  void authenticatedToken() {
    when(decoder.decode("test-token")).thenReturn(Jwt.withTokenValue("test-token")
        .header("alg", "HS256").subject(ID.toString()).claim("email", "student@test.invalid")
        .claim("username", "student").claim("full-name", "Student")
        .claim("role", "STUDENT").claim("status", "ACTIVE").build());
  }

  @Test
  void anonymousRequestsCannotReadOrMutateRooms() throws Exception {
    mvc.perform(get("/api/v1/study-rooms")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/study-rooms/{id}", ID)).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/v1/study-rooms/{id}/join", ID)).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/v1/study-rooms/{id}/heartbeat", ID)).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/v1/study-rooms/{id}/tracks", ID)
        .contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isUnauthorized());
    verifyNoInteractions(service);
  }

  @Test
  void authenticatedStudentsCanListRoomsWithStableJsonContract() throws Exception {
    when(service.list()).thenReturn(List.of(new StudyRoomSummaryResponse(ID, "Cùng học", ID,
        "Student", 1, 25, 5, 15, StudyRoomRequestPolicy.AFTER_FOCUS, 15)));
    mvc.perform(get("/api/v1/study-rooms").header("Authorization", "Bearer test-token"))
        .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(ID.toString()))
        .andExpect(jsonPath("$[0].requestPolicy").value("AFTER_FOCUS"))
        .andExpect(jsonPath("$[0].focusMinutes").value(25));
  }

  @Test
  void snapshotSerializesLivePlaybackAndServerTimestampsForWebClient() throws Exception {
    var now = OffsetDateTime.parse("2026-10-01T00:00:00Z");
    var playback = new StudyRoomSnapshotResponse.Playback("jfKfPfyJRdk", "Lofi Girl", now, 0, true);
    when(service.get(ID)).thenReturn(new StudyRoomSnapshotResponse(ID, "Cùng học", ID,
        "Student", 1, 25, 5, 15, StudyRoomRequestPolicy.AFTER_FOCUS, 15, false,
        now, StudyRoomPhase.FOCUS, now.plusMinutes(25), 1, playback, List.of(), null, List.of()));
    mvc.perform(get("/api/v1/study-rooms/{id}", ID).header("Authorization", "Bearer test-token"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.playback.isDefault").value(true))
        .andExpect(jsonPath("$.playback.videoId").value("jfKfPfyJRdk"))
        .andExpect(jsonPath("$.playback.startedAt").isString())
        .andExpect(jsonPath("$.serverNow").isString())
        .andExpect(jsonPath("$.phaseEndsAt").isString())
        .andExpect(jsonPath("$.phase").value("FOCUS"));
  }

  @Test
  void invalidCreateTrackAndPlaybackRequestsNeverReachService() throws Exception {
    mvc.perform(post("/api/v1/study-rooms").header("Authorization", "Bearer test-token")
        .contentType(MediaType.APPLICATION_JSON).content("""
            {"name":" ","focusMinutes":0,"breakMinutes":0,"longBreakMinutes":100,
             "requestPolicy":"AFTER_FOCUS","minimumStudyMinutes":-1}
            """))
        .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
    mvc.perform(post("/api/v1/study-rooms").header("Authorization", "Bearer test-token")
        .contentType(MediaType.APPLICATION_JSON).content("""
            {"name":"Cùng học","focusMinutes":25,"breakMinutes":20,"longBreakMinutes":10,
             "requestPolicy":"OPEN","minimumStudyMinutes":0}
            """))
        .andExpect(status().isBadRequest());
    mvc.perform(post("/api/v1/study-rooms/{id}/tracks", ID).header("Authorization", "Bearer test-token")
        .contentType(MediaType.APPLICATION_JSON).content("{\"youtubeUrl\":\"\",\"title\":\"\"}"))
        .andExpect(status().isBadRequest());
    mvc.perform(post("/api/v1/study-rooms/{id}/playback/next", ID).header("Authorization", "Bearer test-token")
        .contentType(MediaType.APPLICATION_JSON).content("{\"expectedVersion\":-1}"))
        .andExpect(status().isBadRequest());
    verifyNoInteractions(service);
  }
}
