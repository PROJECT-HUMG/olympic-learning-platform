package me.nghlong3004.olympic.daily.sharing;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.error.GlobalExceptionHandler;
import me.nghlong3004.olympic.common.security.BearerTokenConfig;
import me.nghlong3004.olympic.common.security.JwtCurrentUserAuthenticationConverter;
import me.nghlong3004.olympic.common.security.SecurityFilterChainsConfig;
import me.nghlong3004.olympic.daily.controller.DailyController;
import me.nghlong3004.olympic.daily.service.DailyService;
import me.nghlong3004.olympic.daily.sharing.response.DailySharingResponse;
import me.nghlong3004.olympic.daily.sharing.service.DailyEntrySharingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * HTTP boundary proof; real persistence/ownership is covered separately in
 * DailyGroupMvpIntegrationTest.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/16/2026
 */
@WebMvcTest(
    value = DailyController.class,
    properties = {
      "spring.security.oauth2.client.registration.google.client-id=test",
      "spring.security.oauth2.client.registration.google.client-secret=test",
      "spring.security.oauth2.client.registration.github.client-id=test",
      "spring.security.oauth2.client.registration.github.client-secret=test"
    })
@Import({
  SecurityFilterChainsConfig.class,
  BearerTokenConfig.class,
  JwtCurrentUserAuthenticationConverter.class,
  GlobalExceptionHandler.class
})
class DailySharingApiTest {
  private static final UUID PLAN = UUID.randomUUID();
  private static final String PATH = "/api/v1/daily/plans/" + PLAN + "/sharing";
  @Autowired MockMvc mvc;
  @MockitoBean DailyService daily;
  @MockitoBean DailyEntrySharingService sharing;
  @MockitoBean JwtDecoder decoder;
  @MockitoBean CorsConfigurationSource cors;

  @Test
  void anonymousCannotReadOrMutateAudience() throws Exception {
    mvc.perform(get(PATH)).andExpect(status().isUnauthorized());
    mvc.perform(
            put(PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"expectedVersion\":0,\"audiences\":[]}"))
        .andExpect(status().isUnauthorized());
    verifyNoInteractions(sharing);
  }

  @Test
  @WithMockUser(roles = "STUDENT")
  void emptyAudienceIsExplicitRevokeAndResponseIsNotCacheable() throws Exception {
    when(sharing.replace(eq(PLAN), any())).thenReturn(new DailySharingResponse(PLAN, 2, List.of()));
    mvc.perform(
            put(PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"expectedVersion\":1,\"audiences\":[]}"))
        .andExpect(status().isOk())
        .andExpect(header().string("Cache-Control", "no-store"))
        .andExpect(jsonPath("$.planId").value(PLAN.toString()))
        .andExpect(jsonPath("$.version").value(2));
  }

  @Test
  @WithMockUser(roles = "STUDENT")
  void malformedAndUnversionedRequestsFailBeforeService() throws Exception {
    for (var body :
        List.of(
            "{}",
            "{\"expectedVersion\":-1,\"audiences\":[]}",
            "{\"expectedVersion\":0,\"audiences\":[null]}",
            "{\"expectedVersion\":0,\"audiences\":[{\"groupId\":\"bad\",\"viewerIds\":[]}]}")) {
      mvc.perform(put(PATH).contentType(MediaType.APPLICATION_JSON).content(body))
          .andExpect(status().isBadRequest());
    }
    verifyNoInteractions(sharing);
  }

  @Test
  @WithMockUser(roles = "ADMIN")
  void ownershipDenialIsNotConvertedToSuccessForAdministrators() throws Exception {
    when(sharing.read(PLAN)).thenThrow(ErrorCode.ACCESS_DENIED.throwIt());
    mvc.perform(get(PATH)).andExpect(status().isForbidden());
  }
}
