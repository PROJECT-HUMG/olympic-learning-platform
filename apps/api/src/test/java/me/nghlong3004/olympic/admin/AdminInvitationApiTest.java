package me.nghlong3004.olympic.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.admin.controller.AdminUserController;
import me.nghlong3004.olympic.admin.mapper.AdminUserMapper;
import me.nghlong3004.olympic.admin.request.AdminCreateUserRequest;
import me.nghlong3004.olympic.admin.service.UserAdministrationService;
import me.nghlong3004.olympic.admin.service.impl.UserAdministrationServiceImpl;
import me.nghlong3004.olympic.auth.dto.AuthEmailTokenIssue;
import me.nghlong3004.olympic.auth.enums.AuthEmailTokenPurpose;
import me.nghlong3004.olympic.auth.service.AuthEmailTokenService;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.error.GlobalExceptionHandler;
import me.nghlong3004.olympic.common.mail.event.MailSendEvent;
import me.nghlong3004.olympic.common.mail.model.AdminInviteMailModel;
import me.nghlong3004.olympic.common.properties.AuthProperties;
import me.nghlong3004.olympic.common.properties.ClientProperties;
import me.nghlong3004.olympic.common.properties.UserProperties;
import me.nghlong3004.olympic.common.security.BearerTokenConfig;
import me.nghlong3004.olympic.common.security.JwtCurrentUserAuthenticationConverter;
import me.nghlong3004.olympic.common.security.SecurityFilterChainsConfig;
import me.nghlong3004.olympic.common.util.AuthLinkBuilder;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.mapper.UserMapper;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Real route/method security and invitation service with synthetic persistence/token issuance. No
 * mail listener/provider is loaded; event observation is not delivery or transaction proof.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/16/2026
 */
@WebMvcTest(AdminUserController.class)
@Import({
  SecurityFilterChainsConfig.class,
  BearerTokenConfig.class,
  JwtCurrentUserAuthenticationConverter.class,
  GlobalExceptionHandler.class,
  UserAdministrationServiceImpl.class,
  AdminInvitationApiTest.Dependencies.class
})
@RecordApplicationEvents
@TestPropertySource(
    properties = {
      "spring.security.oauth2.client.registration.google.client-id=test",
      "spring.security.oauth2.client.registration.google.client-secret=test",
      "spring.security.oauth2.client.registration.github.client-id=test",
      "spring.security.oauth2.client.registration.github.client-secret=test",
      "logging.level.org.springframework.security=ERROR",
      "logging.level.me.nghlong3004.olympic=INFO"
    })
class AdminInvitationApiTest {
  @Autowired MockMvc mvc;
  @Autowired UserAdministrationService service;
  @Autowired ApplicationEvents events;
  @MockitoBean UserRepository users;
  @MockitoBean AuthEmailTokenService tokens;
  @MockitoBean JwtDecoder decoder;
  @MockitoBean CorsConfigurationSource cors;

  @BeforeEach
  void bearerTokens() {
    for (var role : Role.values()) {
      when(decoder.decode(role.name()))
          .thenReturn(
              Jwt.withTokenValue(role.name())
                  .header("alg", "HS256")
                  .subject(UUID.randomUUID().toString())
                  .claim("email", "admin@example.invalid")
                  .claim("username", "operator")
                  .claim("full-name", "Operator")
                  .claim("role", role.name())
                  .claim("status", "ACTIVE")
                  .build());
    }
  }

  private String body(String role) {
    return "{\"email\":\"invite@example.invalid\",\"username\":\"new-lecturer\","
        + "\"fullName\":\"Nguyễn Giảng Viên\",\"role\":\""
        + role
        + "\"}";
  }

  @Test
  void anonymousStudentsAndLecturersCannotCreateAccounts() throws Exception {
    mvc.perform(
            post("/api/v1/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("LECTURER")))
        .andExpect(status().isUnauthorized());
    for (var role : new String[] {"STUDENT", "LECTURER"}) {
      mvc.perform(
              post("/api/v1/admin/users")
                  .header("Authorization", "Bearer " + role)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(body("ADMIN")))
          .andExpect(status().isForbidden());
    }
    verifyNoInteractions(users, tokens);
  }

  @Test
  @WithMockUser(roles = "STUDENT")
  void serviceItselfAlsoRequiresAdministrator() {
    assertThatThrownBy(
            () ->
                service.createUser(
                    new AdminCreateUserRequest(
                        "invite@example.invalid", "new-lecturer", "Name", Role.ADMIN),
                    "local",
                    "test"))
        .isInstanceOf(AccessDeniedException.class);
    verifyNoInteractions(users, tokens);
  }

  @Test
  void adminCreatesPendingAccountForEachEstablishedRoleWithoutReturningTokenOrPassword()
      throws Exception {
    when(users.save(any(User.class)))
        .thenAnswer(
            invocation -> {
              User user = invocation.getArgument(0);
              user.setId(UUID.randomUUID());
              assertThat(user.getPasswordHash()).isNull();
              assertThat(user.getStatus().name()).isEqualTo("PENDING");
              return user;
            });
    when(tokens.issue(any(), eq(AuthEmailTokenPurpose.ADMIN_INVITE), any(), anyString(), any()))
        .thenReturn(
            new AuthEmailTokenIssue(
                "synthetic-invitation-only", OffsetDateTime.parse("2026-10-17T00:00:00Z")));
    for (var role : Role.values()) {
      mvc.perform(
              post("/api/v1/admin/users")
                  .header("Authorization", "Bearer ADMIN")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(body(role.name())))
          .andExpect(status().isCreated())
          .andExpect(header().string("Cache-Control", "no-store"))
          .andExpect(jsonPath("$.user.role").value(role.name()))
          .andExpect(jsonPath("$.user.status").value("PENDING"))
          .andExpect(jsonPath("$.user.passwordHash").doesNotExist())
          .andExpect(jsonPath("$.token").doesNotExist());
    }
    var mail = events.stream(MailSendEvent.class).map(MailSendEvent::model).toList();
    assertThat(mail)
        .hasSize(3)
        .allSatisfy(
            model -> {
              assertThat(model).isInstanceOf(AdminInviteMailModel.class);
              assertThat(((AdminInviteMailModel) model).inviteLink())
                  .isEqualTo("http://localhost/reset-password?token=synthetic-invitation-only");
            });
  }

  @Test
  void invalidInputsAndUnknownOrMissingRoleDoNotIssueInvitations() throws Exception {
    for (var body :
        new String[] {
          "{}",
          body("UNKNOWN"),
          body("ADMIN").replace("\"ADMIN\"", "null"),
          body("LECTURER").replace("invite@example.invalid", "not-email"),
          body("LECTURER").replace("new-lecturer", "x"),
          body("LECTURER").replace("Nguyễn Giảng Viên", " ")
        }) {
      mvc.perform(
              post("/api/v1/admin/users")
                  .header("Authorization", "Bearer ADMIN")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(body))
          .andExpect(status().isBadRequest());
    }
    verifyNoInteractions(users, tokens);
  }

  @Test
  void duplicateEmailOrUsernameIsRecoverableConflictWithoutIssuingAnotherToken() throws Exception {
    when(users.existsByEmailIgnoreCaseAndDeletedAtIsNull("invite@example.invalid"))
        .thenReturn(true);
    mvc.perform(
            post("/api/v1/admin/users")
                .header("Authorization", "Bearer ADMIN")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("LECTURER")))
        .andExpect(status().isConflict());
    when(users.existsByEmailIgnoreCaseAndDeletedAtIsNull("invite@example.invalid"))
        .thenReturn(false);
    when(users.findByUsernameIgnoreCaseAndDeletedAtIsNull("new-lecturer"))
        .thenReturn(Optional.of(new User()));
    mvc.perform(
            post("/api/v1/admin/users")
                .header("Authorization", "Bearer ADMIN")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("LECTURER")))
        .andExpect(status().isConflict());
    verifyNoInteractions(tokens);
    assertThat(events.stream(MailSendEvent.class)).isEmpty();
  }

  @Test
  void failedTokenIssuanceDoesNotPublishMailAndCanBeReportedAsRetryableFailure() throws Exception {
    when(users.save(any(User.class)))
        .thenAnswer(
            invocation -> {
              User user = invocation.getArgument(0);
              user.setId(UUID.randomUUID());
              return user;
            });
    when(tokens.issue(any(), any(), any(), any(), any()))
        .thenThrow(ErrorCode.INTERNAL_ERROR.throwIt());
    mvc.perform(
            post("/api/v1/admin/users")
                .header("Authorization", "Bearer ADMIN")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("LECTURER")))
        .andExpect(status().isInternalServerError());
    assertThat(events.stream(MailSendEvent.class)).isEmpty();
  }

  @TestConfiguration
  static class Dependencies {
    @Bean
    Clock clock() {
      return Clock.fixed(Instant.parse("2026-10-16T00:00:00Z"), ZoneOffset.UTC);
    }

    @Bean
    AuthProperties authProperties() {
      return new AuthProperties(null, null);
    }

    @Bean
    UserProperties userProperties() {
      return new UserProperties(null);
    }

    @Bean
    AuthLinkBuilder links() {
      return new AuthLinkBuilder(new ClientProperties("http://localhost"));
    }

    @Bean
    UserMapper userMapper() {
      return Mappers.getMapper(UserMapper.class);
    }

    @Bean
    AdminUserMapper adminUserMapper() {
      return Mappers.getMapper(AdminUserMapper.class);
    }
  }
}
