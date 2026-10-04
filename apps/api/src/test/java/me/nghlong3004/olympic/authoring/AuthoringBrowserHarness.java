package me.nghlong3004.olympic.authoring;

import jakarta.validation.Valid;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.auth.request.LoginRequest;
import me.nghlong3004.olympic.auth.response.CurrentUserResponse;
import me.nghlong3004.olympic.auth.response.LoginResponse;
import me.nghlong3004.olympic.common.config.JsonNodeCompatibilityConfig;
import me.nghlong3004.olympic.common.config.JwtConfig;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.error.GlobalExceptionHandler;
import me.nghlong3004.olympic.common.properties.ClientProperties;
import me.nghlong3004.olympic.common.properties.UserProperties;
import me.nghlong3004.olympic.common.security.BearerTokenConfig;
import me.nghlong3004.olympic.common.security.CorsConfig;
import me.nghlong3004.olympic.common.security.JwtCurrentUserAuthenticationConverter;
import me.nghlong3004.olympic.common.security.SecurityCurrentUserProvider;
import me.nghlong3004.olympic.common.security.SecurityFilterChainsConfig;
import me.nghlong3004.olympic.common.util.DefaultSlugGenerator;
import me.nghlong3004.olympic.daily.controller.DailyController;
import me.nghlong3004.olympic.daily.evidence.controller.EvidenceController;
import me.nghlong3004.olympic.daily.evidence.controller.EvidencePrivacyFilter;
import me.nghlong3004.olympic.daily.evidence.service.impl.EvidenceServiceImpl;
import me.nghlong3004.olympic.daily.service.impl.DailyServiceImpl;
import me.nghlong3004.olympic.daily.mapper.DailyMapperImpl;
import me.nghlong3004.olympic.daily.evidence.mapper.EvidenceMapperImpl;
import me.nghlong3004.olympic.daily.feedback.mapper.DailyFeedbackMapperImpl;
import me.nghlong3004.olympic.daily.sharing.mapper.SharedDailyMapperImpl;
import me.nghlong3004.olympic.group.mapper.GroupMapperImpl;
import me.nghlong3004.olympic.group.service.impl.GroupDailyAccessImpl;
import me.nghlong3004.olympic.group.controller.GroupController;
import me.nghlong3004.olympic.group.controller.GroupPrivacyFilter;
import me.nghlong3004.olympic.group.service.impl.GroupServiceImpl;
import me.nghlong3004.olympic.group.service.impl.GroupMembershipServiceImpl;
import me.nghlong3004.olympic.daily.sharing.controller.SharedDailyController;
import me.nghlong3004.olympic.daily.sharing.service.impl.SharedDailyAccessImpl;
import me.nghlong3004.olympic.daily.sharing.service.impl.SharedDailyServiceImpl;
import me.nghlong3004.olympic.daily.feedback.controller.DailyFeedbackController;
import me.nghlong3004.olympic.daily.feedback.service.impl.DailyFeedbackServiceImpl;
import me.nghlong3004.olympic.document.controller.DocumentMetadataController;
import me.nghlong3004.olympic.document.mapper.CategoryMapperImpl;
import me.nghlong3004.olympic.document.mapper.SubjectMapperImpl;
import me.nghlong3004.olympic.document.mapper.TagMapperImpl;
import me.nghlong3004.olympic.document.service.impl.DocumentCategoryServiceImpl;
import me.nghlong3004.olympic.document.service.impl.SubjectServiceImpl;
import me.nghlong3004.olympic.document.service.impl.TagServiceImpl;
import me.nghlong3004.olympic.exam.controller.ExamController;
import me.nghlong3004.olympic.exam.service.impl.ExamAccess;
import me.nghlong3004.olympic.exam.service.impl.ExamDrafts;
import me.nghlong3004.olympic.exam.service.impl.ExamPaperReads;
import me.nghlong3004.olympic.exam.service.impl.ExamPlacementPolicy;
import me.nghlong3004.olympic.exam.service.impl.ExamProjections;
import me.nghlong3004.olympic.exam.service.impl.ExamPublication;
import me.nghlong3004.olympic.exam.service.impl.ExamQuestionSourcePolicy;
import me.nghlong3004.olympic.exam.service.impl.ExamServiceImpl;
import me.nghlong3004.olympic.question.controller.QuestionController;
import me.nghlong3004.olympic.question.mapper.QuestionMapperImpl;
import me.nghlong3004.olympic.question.service.impl.QuestionFigurePolicy;
import me.nghlong3004.olympic.question.service.impl.QuestionManualContentValidator;
import me.nghlong3004.olympic.question.service.impl.QuestionServiceImpl;
import me.nghlong3004.olympic.question.service.impl.QuestionValidationServiceImpl;
import me.nghlong3004.olympic.storage.dto.UploadedFile;
import me.nghlong3004.olympic.storage.enums.StorageFolder;
import me.nghlong3004.olympic.storage.mapper.FileMapperImpl;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.topic.controller.TopicController;
import me.nghlong3004.olympic.topic.mapper.TopicMapperImpl;
import me.nghlong3004.olympic.topic.service.impl.TopicServiceImpl;
import me.nghlong3004.olympic.user.controller.UserController;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;
import me.nghlong3004.olympic.user.mapper.UserMapper;
import me.nghlong3004.olympic.user.mapper.UserMapperImpl;
import me.nghlong3004.olympic.user.repository.UserRepository;
import me.nghlong3004.olympic.user.service.impl.UserServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.ai.model.deepseek.autoconfigure.DeepSeekChatAutoConfiguration;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.data.redis.autoconfigure.DataRedisAutoConfiguration;
import org.springframework.boot.data.redis.autoconfigure.DataRedisReactiveAutoConfiguration;
import org.springframework.boot.data.redis.autoconfigure.DataRedisRepositoriesAutoConfiguration;
import org.springframework.boot.data.redis.autoconfigure.health.DataRedisHealthContributorAutoConfiguration;
import org.springframework.boot.data.redis.autoconfigure.health.DataRedisReactiveHealthContributorAutoConfiguration;
import org.springframework.boot.data.redis.autoconfigure.observation.LettuceObservationAutoConfiguration;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.mail.autoconfigure.MailHealthContributorAutoConfiguration;
import org.springframework.boot.mail.autoconfigure.MailSenderAutoConfiguration;
import org.springframework.boot.mail.autoconfigure.MailSenderValidatorAutoConfiguration;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.security.oauth2.client.autoconfigure.OAuth2ClientAutoConfiguration;
import org.springframework.boot.security.oauth2.client.autoconfigure.reactive.ReactiveOAuth2ClientAutoConfiguration;
import org.springframework.boot.security.oauth2.client.autoconfigure.reactive.ReactiveOAuth2ClientWebSecurityAutoConfiguration;
import org.springframework.boot.security.oauth2.client.autoconfigure.servlet.OAuth2ClientWebSecurityAutoConfiguration;
import org.springframework.boot.security.oauth2.server.resource.autoconfigure.servlet.OAuth2ResourceServerAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestComponent;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Opt-in loopback HTTP fixture for question and exam browser checks. Question, exam, current-user,
 * document-metadata, topic, and owner Daily controllers use the disposable PostgreSQL database,
 * the production security chain, and {@link JwtCurrentUserAuthenticationConverter}. Bearer strings are decoded
 * only by the fixture {@link JwtDecoder}. This does not prove {@code AuthService} login or
 * cryptographic JWT issuance. {@code @SpringBootApplication} stays unused so Redis, mail, OAuth,
 * Cloudinary, and {@code JwtConfig} are not started.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@SpringBootTest(
    classes = AuthoringBrowserHarness.Harness.class,
    webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT,
    properties = {
      "server.address=127.0.0.1",
      "server.port=${authoring.browser.port:8080}",
      "spring.jpa.hibernate.ddl-auto=validate",
      "spring.flyway.enabled=true",
      "spring.jpa.open-in-view=false",
      "spring.jpa.show-sql=false",
      "olympic.client.base-url=http://localhost:3000",
      "olympic.user.default-avatar-url=http://127.0.0.1/authoring-browser-avatar",
      "olympic.storage.provider=none",
      "management.health.redis.enabled=false",
      "management.health.mail.enabled=false",
      "logging.level.org.springframework.security=WARN",
      "logging.level.org.hibernate.SQL=WARN",
      "logging.level.org.hibernate.orm.jdbc.bind=WARN"
    })
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("authoring-browser")
@EnabledIfEnvironmentVariable(named = "AUTHORING_BROWSER", matches = "true")
@Testcontainers(disabledWithoutDocker = true)
class AuthoringBrowserHarness {
  static final String FIXTURE_PASSWORD = "authoring-browser";
  private static final UUID SUBJECT_ID = UUID.fromString("00000000-0000-0000-0000-000000000a11");
  private static final UUID TOPIC_ID = UUID.fromString("00000000-0000-0000-0000-000000000a12");
  private static final String DAILY_DATE = "2026-10-05";
  private static final List<FixtureUser> USERS = List.of(
      new FixtureUser(
          UUID.fromString("00000000-0000-0000-0000-000000000a01"),
          "authoring-lecturer@example.com",
          "authoring-lecturer",
          "Authoring Lecturer",
          Role.LECTURER,
          "authoring-lecturer"),
      new FixtureUser(
          UUID.fromString("00000000-0000-0000-0000-000000000a02"),
          "authoring-admin@example.com",
          "authoring-admin",
          "Authoring Admin",
          Role.ADMIN,
          "authoring-admin"),
      new FixtureUser(
          UUID.fromString("00000000-0000-0000-0000-000000000a03"),
          "authoring-student@example.com",
          "authoring-student",
          "Authoring Student",
          Role.STUDENT,
          "authoring-student"));
  private static final Map<String, FixtureUser> BY_TOKEN = USERS.stream()
      .collect(Collectors.toUnmodifiableMap(FixtureUser::token, Function.identity()));
  private static final Map<UUID, FixtureUser> BY_ID = USERS.stream()
      .collect(Collectors.toUnmodifiableMap(FixtureUser::id, Function.identity()));

  @Container
  @ServiceConnection
  static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");

  @DynamicPropertySource
  static void disposableDatabase(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", AuthoringBrowserHarness::jdbcUrl);
    registry.add("spring.datasource.username", POSTGRES::getUsername);
    registry.add("spring.datasource.password", POSTGRES::getPassword);
  }

  @Test
  @Timeout(value = 31, unit = TimeUnit.MINUTES)
  void holdsLoopbackUntilTimeout() {
    try {
      Thread.sleep(Duration.ofSeconds(holdSeconds()));
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
    }
  }

  private static String jdbcUrl() {
    if (!POSTGRES.isRunning()) {
      POSTGRES.start();
    }
    return POSTGRES.getJdbcUrl();
  }

  private static long holdSeconds() {
    long configured = Long.getLong("authoring.browser.seconds", 900L);
    if (configured < 1L) {
      return 1L;
    }
    return Math.min(configured, 1800L);
  }

  private static FixtureUser user(Role role) {
    return USERS.stream().filter(candidate -> candidate.role() == role).findFirst().orElseThrow();
  }

  private static void seed(JdbcTemplate jdbc) {
    for (FixtureUser user : USERS) {
      jdbc.update(
          """
          INSERT INTO users (id, email, username, full_name, role, status)
          VALUES (?, ?, ?, ?, ?::user_role, 'ACTIVE')
          """,
          user.id(), user.email(), user.username(), user.fullName(), user.role().name());
    }
    jdbc.update(
        "INSERT INTO subjects (id, code, name, slug) VALUES (?, 'AUB', 'Authoring', 'authoring-browser')",
        SUBJECT_ID);
    jdbc.update(
        "INSERT INTO topics (id, subject_id, name, slug) VALUES (?, ?, 'Drafts', 'drafts')",
        TOPIC_ID, SUBJECT_ID);
  }

  private static void probe(String root) {
    HttpClient client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5))
        .followRedirects(HttpClient.Redirect.NEVER)
        .build();
    FixtureUser lecturer = user(Role.LECTURER);
    status(client, root + "/questions", null, 401);
    status(client, root + "/questions", lecturer, 200);
    bodyHas(client, root + "/users/me", lecturer, 200, lecturer.id().toString());
    bodyHas(client, root + "/documents/metadata", null, 200, SUBJECT_ID.toString());
    bodyHas(
        client,
        root + "/topics?subjectId=" + SUBJECT_ID,
        lecturer,
        200,
        TOPIC_ID.toString());
    status(client, root + "/exams", lecturer, 200);
    status(client, root + "/questions", user(Role.STUDENT), 403);
    status(client, root + "/daily/plans?date=" + DAILY_DATE, null, 401);
    status(client, root + "/daily/weeks?weekStart=" + DAILY_DATE, null, 401);
    for (FixtureUser fixture : USERS) {
      status(client, root + "/daily/plans?date=" + DAILY_DATE, fixture, 404);
      bodyHas(client, root + "/daily/weeks?weekStart=" + DAILY_DATE, fixture, 200, "\"plannedDays\":0");
    }
  }

  private static void status(HttpClient client, String url, FixtureUser user, int expected) {
    HttpResponse<String> response = send(client, request(url, user), path(url));
    if (response.statusCode() != expected) {
      throw failed(url, response.statusCode());
    }
  }

  private static void bodyHas(
      HttpClient client, String url, FixtureUser user, int expected, String needle) {
    HttpResponse<String> response = send(client, request(url, user), path(url));
    if (response.statusCode() != expected || !response.body().contains(needle)) {
      throw failed(url, response.statusCode());
    }
  }

  private static HttpRequest request(String url, FixtureUser user) {
    HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(5)).GET();
    if (user != null) {
      builder.header("Authorization", "Bearer " + user.token());
    }
    return builder.build();
  }

  private static HttpResponse<String> send(HttpClient client, HttpRequest request, String path) {
    IOException last = null;
    for (int attempt = 1; attempt <= 5; attempt++) {
      try {
        return client.send(request, HttpResponse.BodyHandlers.ofString());
      } catch (InterruptedException exception) {
        Thread.currentThread().interrupt();
        throw new IllegalStateException("Authoring browser probe interrupted: path=" + path);
      } catch (IOException exception) {
        last = exception;
        try {
          Thread.sleep(Duration.ofMillis(200));
        } catch (InterruptedException interrupted) {
          Thread.currentThread().interrupt();
          throw new IllegalStateException("Authoring browser probe interrupted: path=" + path);
        }
      }
    }
    String error = last == null ? "unknown" : last.getClass().getSimpleName();
    throw new IllegalStateException("Authoring browser probe failed: path=" + path + " error=" + error);
  }

  private static IllegalStateException failed(String url, int status) {
    return new IllegalStateException(
        "Authoring browser probe failed: path=" + path(url) + " status=" + status);
  }

  private static String path(String url) {
    URI uri = URI.create(url);
    return uri.getRawQuery() == null ? uri.getRawPath() : uri.getRawPath() + "?" + uri.getRawQuery();
  }

  private static boolean passwordMatches(String password) {
    return MessageDigest.isEqual(
        FIXTURE_PASSWORD.getBytes(StandardCharsets.UTF_8), password.getBytes(StandardCharsets.UTF_8));
  }

  /**
   * Narrow servlet context. Component scanning stays off so production auth, JWT signing, Redis,
   * mail, OAuth, and Cloudinary are outside this process.
   */
  @Configuration(proxyBeanMethods = false)
  @TestComponent
  @EnableAutoConfiguration(exclude = {
    DataRedisAutoConfiguration.class,
    DataRedisReactiveAutoConfiguration.class,
    DataRedisRepositoriesAutoConfiguration.class,
    DataRedisHealthContributorAutoConfiguration.class,
    DataRedisReactiveHealthContributorAutoConfiguration.class,
    LettuceObservationAutoConfiguration.class,
    MailSenderAutoConfiguration.class,
    MailSenderValidatorAutoConfiguration.class,
    MailHealthContributorAutoConfiguration.class,
    OAuth2ClientAutoConfiguration.class,
    ReactiveOAuth2ClientAutoConfiguration.class,
    ReactiveOAuth2ClientWebSecurityAutoConfiguration.class,
    OAuth2ClientWebSecurityAutoConfiguration.class,
    OAuth2ResourceServerAutoConfiguration.class,
    UserDetailsServiceAutoConfiguration.class,
    DeepSeekChatAutoConfiguration.class
  })
  @EnableConfigurationProperties({ClientProperties.class, UserProperties.class})
  @EntityScan(basePackages = "me.nghlong3004.olympic")
  @EnableJpaRepositories(basePackages = "me.nghlong3004.olympic")
  @Import({
    QuestionController.class,
    ExamController.class,
    DailyController.class,
    EvidenceController.class,
    EvidencePrivacyFilter.class,
    EvidenceServiceImpl.class,
    GroupDailyAccessImpl.class,
    GroupController.class,
    GroupPrivacyFilter.class,
    GroupServiceImpl.class,
    GroupMembershipServiceImpl.class,
    SharedDailyController.class,
    SharedDailyAccessImpl.class,
    SharedDailyServiceImpl.class,
    DailyFeedbackController.class,
    DailyFeedbackServiceImpl.class,
    UserController.class,
    DocumentMetadataController.class,
    TopicController.class,
    AuthoringBrowserLoginController.class,
    QuestionServiceImpl.class,
    QuestionValidationServiceImpl.class,
    QuestionFigurePolicy.class,
    QuestionManualContentValidator.class,
    QuestionMapperImpl.class,
    ExamServiceImpl.class,
    ExamAccess.class,
    ExamDrafts.class,
    ExamPublication.class,
    ExamPaperReads.class,
    ExamProjections.class,
    ExamPlacementPolicy.class,
    ExamQuestionSourcePolicy.class,
    DailyServiceImpl.class,
    DailyMapperImpl.class,
    EvidenceMapperImpl.class,
    DailyFeedbackMapperImpl.class,
    SharedDailyMapperImpl.class,
    GroupMapperImpl.class,
    UserServiceImpl.class,
    UserMapperImpl.class,
    FileMapperImpl.class,
    SubjectServiceImpl.class,
    SubjectMapperImpl.class,
    TagServiceImpl.class,
    TagMapperImpl.class,
    DocumentCategoryServiceImpl.class,
    CategoryMapperImpl.class,
    TopicServiceImpl.class,
    TopicMapperImpl.class,
    DefaultSlugGenerator.class,
    SecurityFilterChainsConfig.class,
    BearerTokenConfig.class,
    JwtCurrentUserAuthenticationConverter.class,
    SecurityCurrentUserProvider.class,
    GlobalExceptionHandler.class,
    JsonNodeCompatibilityConfig.class,
    CorsConfig.class
  })
  @Slf4j
  static class Harness {
    @Bean
    Clock clock() {
      return Clock.systemUTC();
    }

    @Bean
    JwtDecoder jwtDecoder(Clock clock) {
      return token -> {
        FixtureUser user = BY_TOKEN.get(token);
        if (user == null) {
          throw new BadJwtException("Unknown authoring browser fixture token");
        }
        Instant issued = clock.instant();
        return Jwt.withTokenValue(token)
            .header("alg", "none")
            .subject(user.id().toString())
            .claim(JwtConfig.EMAIL_CLAIM, user.email())
            .claim(JwtConfig.USERNAME_CLAIM, user.username())
            .claim(JwtConfig.FULL_NAME_CLAIM, user.fullName())
            .claim(JwtConfig.ROLE_CLAIM, user.role().name())
            .claim(JwtConfig.STATUS_CLAIM, Status.ACTIVE.name())
            .issuedAt(issued)
            .expiresAt(issued.plusSeconds(3600))
            .build();
      };
    }

    @Bean
    StorageService storageService() {
      return new RefusingStorageService();
    }

    @Bean
    ApplicationRunner readiness(JdbcTemplate jdbc, Clock clock, Environment environment) {
      return arguments -> {
        seed(jdbc);
        int port = Integer.parseInt(environment.getProperty("local.server.port", "0"));
        String root = "http://127.0.0.1:" + port + "/api/v1";
        probe(root);
        log.info(
            "Authoring browser fixture ready: url={} clock={} lecturerId={} adminId={} studentId={} subjectId={} topicId={} dailyDate={} seconds={}",
            root,
            clock.instant(),
            user(Role.LECTURER).id(),
            user(Role.ADMIN).id(),
            user(Role.STUDENT).id(),
            SUBJECT_ID,
            TOPIC_ID,
            DAILY_DATE,
            holdSeconds());
      };
    }
  }

  /**
   * Fixture login for the existing web form. It checks the fixture password and returns the fixed
   * bearer for a seeded active user. It does not issue or verify a JWT.
   *
   * @author nghlong3004 (Long Nguyen Hoang)
   * @since 10/4/2026
   */
  @Slf4j
  @RestController
  @TestComponent
  @RequiredArgsConstructor
  static class AuthoringBrowserLoginController {
    private final UserRepository users;
    private final UserMapper userMapper;
    private final UserProperties userProperties;

    @PostMapping("/api/v1/auth/login")
    LoginResponse login(@Valid @RequestBody LoginRequest request) {
      if (!passwordMatches(request.password())) {
        throw ErrorCode.INVALID_CREDENTIALS.throwIt();
      }
      String identifier = request.identifier().trim();
      User user = users.findByUsernameIgnoreCaseAndDeletedAtIsNull(identifier)
          .or(() -> users.findByEmailIgnoreCaseAndDeletedAtIsNull(identifier))
          .filter(found -> found.getStatus() == Status.ACTIVE)
          .orElseThrow(ErrorCode.INVALID_CREDENTIALS::throwIt);
      FixtureUser fixture = BY_ID.get(user.getId());
      if (fixture == null) {
        throw ErrorCode.INVALID_CREDENTIALS.throwIt();
      }
      CurrentUserResponse profile = userMapper.toCurrentUserResponse(user)
          .withAvatarUrl(userProperties.defaultAvatarUrl());
      log.info("Authoring browser fixture login accepted: userId={}", user.getId());
      return new LoginResponse(fixture.token(), "Bearer", 3600, profile);
    }
  }

  private record FixtureUser(
      UUID id, String email, String username, String fullName, Role role, String token) {}

  private static final class FixtureClock extends Clock {
    private final Instant now;

    private FixtureClock(Instant now) {
      this.now = now;
    }

    @Override
    public ZoneId getZone() {
      return ZoneOffset.UTC;
    }

    @Override
    public Clock withZone(ZoneId zone) {
      return this;
    }

    @Override
    public Instant instant() {
      return now;
    }
  }

  private static final class RefusingStorageService implements StorageService {
    @Override
    public UploadedFile upload(MultipartFile file, StorageFolder folder) {
      throw closed();
    }

    @Override
    public UploadedFile upload(
        byte[] content, String originalName, String contentType, StorageFolder folder) {
      throw closed();
    }

    @Override
    public void delete(String storageKey) {
      throw closed();
    }

    @Override
    public URI getDownloadUri(String storageKey) {
      throw closed();
    }

    @Override
    public URI getThumbnailUri(String storageKey) {
      throw closed();
    }

    @Override
    public byte[] download(String storageKey) {
      throw closed();
    }

    private static UnsupportedOperationException closed() {
      return new UnsupportedOperationException("Authoring browser fixture storage is closed");
    }
  }
}
