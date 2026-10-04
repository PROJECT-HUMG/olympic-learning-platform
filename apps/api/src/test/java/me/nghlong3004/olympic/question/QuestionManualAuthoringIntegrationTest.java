package me.nghlong3004.olympic.question;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.Clock;
import java.util.List;
import java.util.UUID;
import javax.imageio.ImageIO;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.question.mapper.QuestionMapperImpl;
import me.nghlong3004.olympic.question.repository.QuestionFigureRepository;
import me.nghlong3004.olympic.question.repository.QuestionRepository;
import me.nghlong3004.olympic.question.request.UpdateQuestionRequest;
import me.nghlong3004.olympic.question.service.QuestionService;
import me.nghlong3004.olympic.question.service.impl.QuestionFigurePolicy;
import me.nghlong3004.olympic.question.service.impl.QuestionManualContentValidator;
import me.nghlong3004.olympic.question.service.impl.QuestionServiceImpl;
import me.nghlong3004.olympic.question.service.impl.QuestionValidationServiceImpl;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;
import org.mockito.Mockito;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@DataJpaTest(properties = {"spring.jpa.hibernate.ddl-auto=validate", "spring.flyway.enabled=true"}, showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({
  QuestionServiceImpl.class,
  QuestionManualContentValidator.class,
  QuestionFigurePolicy.class,
  QuestionValidationServiceImpl.class,
  QuestionMapperImpl.class,
  QuestionManualAuthoringIntegrationTest.Dependencies.class
})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Testcontainers(disabledWithoutDocker = true)
class QuestionManualAuthoringIntegrationTest {
  private static final UUID AUTHOR = UUID.fromString("00000000-0000-0000-0000-000000000401");
  private static final UUID OTHER = UUID.fromString("00000000-0000-0000-0000-000000000402");
  private static final UUID ADMIN = UUID.fromString("00000000-0000-0000-0000-000000000403");
  private static final UUID STUDENT = UUID.fromString("00000000-0000-0000-0000-000000000404");
  private static final UUID SUBJECT = UUID.fromString("00000000-0000-0000-0000-000000000405");
  private static final UUID TOPIC = UUID.fromString("00000000-0000-0000-0000-000000000406");

  @Container
  @ServiceConnection
  static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");

  @Autowired private JdbcTemplate jdbc;
  @Autowired private QuestionService service;
  @Autowired private QuestionRepository questions;
  @Autowired private QuestionFigureRepository figures;
  private final ObjectMapper mapper = new ObjectMapper();

  @BeforeEach
  void seed() {
    jdbc.update(
        "DELETE FROM question_figures WHERE question_id IN (SELECT id FROM questions WHERE created_by IN (?,?,?,?))",
        AUTHOR, OTHER, ADMIN, STUDENT);
    jdbc.update(
        "DELETE FROM question_assets WHERE question_id IN (SELECT id FROM questions WHERE created_by IN (?,?,?,?))",
        AUTHOR, OTHER, ADMIN, STUDENT);
    jdbc.update("DELETE FROM questions WHERE created_by IN (?,?,?,?)", AUTHOR, OTHER, ADMIN, STUDENT);
    jdbc.update("DELETE FROM topics WHERE id = ?", TOPIC);
    jdbc.update("DELETE FROM subjects WHERE id = ?", SUBJECT);
    jdbc.update("DELETE FROM users WHERE id IN (?,?,?,?)", AUTHOR, OTHER, ADMIN, STUDENT);
    jdbc.update("INSERT INTO users (id, email, username, role, status) VALUES (?, ?, ?, 'LECTURER', 'ACTIVE')",
        AUTHOR, "author-question@example.com", "author-question");
    jdbc.update("INSERT INTO users (id, email, username, role, status) VALUES (?, ?, ?, 'LECTURER', 'ACTIVE')",
        OTHER, "other-question@example.com", "other-question");
    jdbc.update("INSERT INTO users (id, email, username, role, status) VALUES (?, ?, ?, 'ADMIN', 'ACTIVE')",
        ADMIN, "admin-question@example.com", "admin-question");
    jdbc.update("INSERT INTO users (id, email, username, role, status) VALUES (?, ?, ?, 'STUDENT', 'ACTIVE')",
        STUDENT, "student-question@example.com", "student-question");
    jdbc.update(
        "INSERT INTO subjects (id, code, name, slug) VALUES (?, 'MAN', 'Manual', 'manual-author')", SUBJECT);
    jdbc.update(
        "INSERT INTO topics (id, subject_id, name, slug) VALUES (?, ?, 'Proofs', 'proofs')", TOPIC, SUBJECT);
  }

  @AfterEach
  void clearUser() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void publishRejectsSubjectDisabledAfterSave() throws Exception {
    authenticate(AUTHOR, Role.LECTURER);
    var created = service.create(request("written", draft(), mapper.readTree("{\"parts\":[]}"), null));
    jdbc.update("UPDATE subjects SET enabled = false WHERE id = ?", SUBJECT);

    assertThatThrownBy(() -> service.publish(created.id()))
        .isInstanceOf(ApiException.class)
        .hasMessage("Subject and topic must be enabled");
  }

  @Test
  void ownershipVersionDuplicateAndPrivateFigures() throws Exception {
    authenticate(AUTHOR, Role.LECTURER);
    byte[] image = png();
    var created = service.create(request("written", draft(), mapper.readTree("{\"parts\":[]}"), null));
    assertThat(created.version()).isZero();
    assertThat(created.createdById()).isEqualTo(AUTHOR);
    assertThatThrownBy(() -> service.publish(created.id())).isInstanceOf(ApiException.class);
    var figure = service.uploadFigure(created.id(), new MockMultipartFile("file", "plot.png", "image/png", image));
    ObjectNode publishedContent = (ObjectNode) draft();
    ((ObjectNode) publishedContent.withArray("stem").get(0)).put("source", "Show it");
    ObjectNode figureBlock = publishedContent.withArray("stem").addObject();
    figureBlock.put("id", "fig");
    figureBlock.put("kind", "figure_group");
    figureBlock.put("layout", "full_width");
    figureBlock.putArray("figures").addObject()
        .put("assetId", figure.id().toString())
        .put("alt", "plot")
        .put("caption", "");
    var updated = service.update(
        created.id(), request("written", publishedContent, mapper.readTree("{\"parts\":[]}"), 0L));
    assertThat(updated.version()).isEqualTo(1L);
    assertThatThrownBy(() -> service.update(
            created.id(), request("written", publishedContent, mapper.readTree("{\"parts\":[]}"), 0L)))
        .extracting("errorCode")
        .isEqualTo(ErrorCode.RESOURCE_STATE_CONFLICT);
    service.publish(updated.id());

    authenticate(OTHER, Role.LECTURER);
    assertThat(service.get(created.id()).content().get("schemaVersion").asInt()).isEqualTo(1);
    assertThat(service.downloadFigure(created.id(), figure.id()).content()).containsExactly(image);
    assertThatThrownBy(() -> service.archive(created.id()))
        .extracting("errorCode")
        .isEqualTo(ErrorCode.RESOURCE_NOT_FOUND);
    var copy = service.duplicate(created.id());
    assertThat(copy.createdById()).isEqualTo(OTHER);
    assertThat(copy.content().toString()).doesNotContain(figure.id().toString());
    assertThat(figures.findByQuestionId(copy.id())).hasSize(1);
    assertThat(copy.content().toString()).contains(figures.findByQuestionId(copy.id()).get(0).getId().toString());

    authenticate(STUDENT, Role.STUDENT);
    assertThatThrownBy(() -> service.get(created.id()))
        .extracting("errorCode")
        .isEqualTo(ErrorCode.ACCESS_DENIED);
    assertThatThrownBy(() -> service.downloadFigure(created.id(), figure.id()))
        .extracting("errorCode")
        .isEqualTo(ErrorCode.ACCESS_DENIED);
  }

  @Test
  void legacyDuplicateStaysLegacyAndFigureBytesAreConstrained() {
    UUID legacyId = UUID.fromString("00000000-0000-0000-0000-000000000407");
    jdbc.update("""
        INSERT INTO questions
          (id, subject_id, topic_id, created_by, status, type, content_json, answer_json, explanation_json, version)
        VALUES (?, ?, ?, ?, 'PUBLISHED', 'multiple_choice', CAST(? AS jsonb), CAST(? AS jsonb),
                CAST('{}' AS jsonb), 0)
        """, legacyId, SUBJECT, TOPIC, AUTHOR, "{\"text\":\"Legacy stem\"}", "{\"value\":\"A\"}");
    authenticate(OTHER, Role.LECTURER);
    var copy = service.duplicate(legacyId);
    var stored = questions.findById(copy.id()).orElseThrow();
    assertThat(stored.getSourceDraftId()).isNull();
    assertThat(stored.getContentJson().path("text").asText()).isEqualTo("Legacy stem");
    assertThat(stored.getContentJson().has("schemaVersion")).isFalse();
    assertThatThrownBy(() -> jdbc.update(
            "INSERT INTO question_figures (id, question_id, original_name, content_type, size, content) VALUES (?,?,?,?,?,?)",
            UUID.randomUUID(), legacyId, "bad.png", "image/png", 2, new byte[] {1}))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  private UpdateQuestionRequest request(String type, JsonNode content, JsonNode answer, Long version) {
    return new UpdateQuestionRequest(SUBJECT, TOPIC, type, content, answer, null, null, version);
  }

  private JsonNode draft() throws Exception {
    return mapper.readTree("""
        {"schemaVersion":1,"title":"Prove","structure":"SINGLE","stem":[{"id":"s","kind":"text","source":""}],
         "parts":[{"id":"p","responseType":"WRITTEN","prompt":[],"options":[]}]}
        """);
  }

  private static byte[] png() throws Exception {
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    ImageIO.write(new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB), "png", out);
    return out.toByteArray();
  }

  private static void authenticate(UUID id, Role role) {
    CurrentUser principal = CurrentUser.builder()
        .id(id)
        .email(id + "@example.com")
        .username(id.toString())
        .role(role)
        .status(Status.ACTIVE)
        .permissions(List.of())
        .build();
    AbstractAuthenticationToken authentication = new AbstractAuthenticationToken(
        List.of(new SimpleGrantedAuthority(role.getAuthority()))) {
      @Override
      public Object getCredentials() {
        return "";
      }

      @Override
      public Object getPrincipal() {
        return principal;
      }
    };
    authentication.setAuthenticated(true);
    SecurityContextHolder.getContext().setAuthentication(authentication);
  }

  @TestConfiguration
  static class Dependencies {
    @Bean
    Clock clock() {
      return Clock.systemUTC();
    }

    @Bean
    CurrentUserProvider currentUserProvider() {
      return new ContextCurrentUserProvider();
    }

    @Bean
    StorageService storageService() {
      return Mockito.mock(StorageService.class);
    }
  }

  static final class ContextCurrentUserProvider implements CurrentUserProvider {
    @Override
    public CurrentUser getCurrentUser() {
      Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
      if (authentication == null || !(authentication.getPrincipal() instanceof CurrentUser user)) {
        throw new IllegalStateException("Test user is not authenticated");
      }
      return user;
    }
  }
}
