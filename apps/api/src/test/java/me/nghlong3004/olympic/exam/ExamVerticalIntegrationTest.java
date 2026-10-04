package me.nghlong3004.olympic.exam;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.sql.Connection;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.List;
import java.util.UUID;
import javax.sql.DataSource;
import javax.imageio.ImageIO;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.config.JsonNodeCompatibilityConfig;
import me.nghlong3004.olympic.common.error.GlobalExceptionHandler;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.exam.controller.ExamController;
import me.nghlong3004.olympic.exam.request.PublishExamRequest;
import me.nghlong3004.olympic.exam.service.ExamService;
import me.nghlong3004.olympic.exam.service.impl.ExamAccess;
import me.nghlong3004.olympic.exam.service.impl.ExamDrafts;
import me.nghlong3004.olympic.exam.service.impl.ExamPaperReads;
import me.nghlong3004.olympic.exam.service.impl.ExamPlacementPolicy;
import me.nghlong3004.olympic.exam.service.impl.ExamProjections;
import me.nghlong3004.olympic.exam.service.impl.ExamPublication;
import me.nghlong3004.olympic.exam.service.impl.ExamQuestionSourcePolicy;
import me.nghlong3004.olympic.exam.service.impl.ExamServiceImpl;
import me.nghlong3004.olympic.question.service.impl.QuestionManualContentValidator;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;
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
import org.springframework.dao.DataAccessException;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.ByteArrayHttpMessageConverter;
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter;
import org.springframework.http.converter.json.ProblemDetailJacksonMixin;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.cfg.DateTimeFeature;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.module.SimpleModule;

/**
 * Vertical PostgreSQL and HTTP proof for one prepared exam.
 * Security filters are not included. MockMvc calls the imported ExamController directly.
 * ExamAccess reloads the active database user from the security-context principal.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@DataJpaTest(properties = {"spring.jpa.hibernate.ddl-auto=validate", "spring.flyway.enabled=true"}, showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({
  ExamController.class,
  ExamServiceImpl.class,
  ExamAccess.class,
  ExamDrafts.class,
  ExamPublication.class,
  ExamPaperReads.class,
  ExamProjections.class,
  ExamPlacementPolicy.class,
  ExamQuestionSourcePolicy.class,
  QuestionManualContentValidator.class,
  GlobalExceptionHandler.class,
  JsonNodeCompatibilityConfig.class,
  ExamVerticalIntegrationTest.Dependencies.class
})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Testcontainers(disabledWithoutDocker = true)
class ExamVerticalIntegrationTest {
  private static final UUID LECTURER = UUID.fromString("00000000-0000-0000-0000-000000000601");
  private static final UUID STUDENT = UUID.fromString("00000000-0000-0000-0000-000000000602");
  private static final UUID SUBJECT = UUID.fromString("00000000-0000-0000-0000-000000000603");
  private static final UUID TOPIC = UUID.fromString("00000000-0000-0000-0000-000000000604");
  private static final UUID QUESTION = UUID.fromString("00000000-0000-0000-0000-000000000605");
  private static final UUID CONTENT_FIGURE = UUID.fromString("00000000-0000-0000-0000-000000000606");
  private static final UUID SOLUTION_FIGURE = UUID.fromString("00000000-0000-0000-0000-000000000607");
  private static final OffsetDateTime RELEASE = OffsetDateTime.parse("2026-10-04T12:00:00Z");

  @Container
  @ServiceConnection
  static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");

  @Autowired private JdbcTemplate jdbc;
  @Autowired private MutableClock clock;
  @Autowired private ExamController controller;
  @Autowired private GlobalExceptionHandler errors;
  @Autowired private SimpleModule legacyJsonNodeModule;
  @Autowired private ExamService examService;
  @Autowired private DataSource dataSource;

  private MockMvc mvc;
  private JsonMapper http;
  private byte[] stemPng;
  private byte[] solutionPng;

  @BeforeEach
  void seed() throws Exception {
    clock.now = RELEASE.minusSeconds(1).toInstant();
    jdbc.update("DELETE FROM exam_paper_figures WHERE question_id = ?", QUESTION);
    jdbc.update("DELETE FROM exam_paper_items WHERE question_id = ?", QUESTION);
    jdbc.update(
        "DELETE FROM exam_papers WHERE exam_id IN (SELECT id FROM exams WHERE created_by IN (?, ?))",
        LECTURER, STUDENT);
    jdbc.update(
        "DELETE FROM exam_items WHERE exam_id IN (SELECT id FROM exams WHERE created_by IN (?, ?))",
        LECTURER, STUDENT);
    jdbc.update("DELETE FROM exams WHERE created_by IN (?, ?)", LECTURER, STUDENT);
    jdbc.update("DELETE FROM question_figures WHERE question_id = ?", QUESTION);
    jdbc.update("DELETE FROM question_assets WHERE question_id = ?", QUESTION);
    jdbc.update("DELETE FROM questions WHERE id = ?", QUESTION);
    jdbc.update("DELETE FROM topics WHERE id = ?", TOPIC);
    jdbc.update("DELETE FROM subjects WHERE id = ?", SUBJECT);
    jdbc.update("DELETE FROM users WHERE id IN (?, ?)", LECTURER, STUDENT);
    jdbc.update(
        "INSERT INTO users (id, email, username, role, status) VALUES (?, ?, ?, 'LECTURER', 'ACTIVE')",
        LECTURER, "exam-lecturer@example.com", "exam-lecturer");
    jdbc.update(
        "INSERT INTO users (id, email, username, role, status) VALUES (?, ?, ?, 'STUDENT', 'ACTIVE')",
        STUDENT, "exam-student@example.com", "exam-student");
    jdbc.update(
        "INSERT INTO subjects (id, code, name, slug) VALUES (?, 'EXM', 'Exam', 'exam-vertical')", SUBJECT);
    jdbc.update(
        "INSERT INTO topics (id, subject_id, name, slug) VALUES (?, ?, 'Heat', 'heat')", TOPIC, SUBJECT);
    jdbc.update(
        """
        INSERT INTO questions
          (id, subject_id, topic_id, created_by, status, type, content_json, answer_json, explanation_json, version)
        VALUES (?, ?, ?, ?, 'PUBLISHED', 'single_choice', CAST(? AS jsonb), CAST(? AS jsonb), CAST(? AS jsonb), 0)
        """,
        QUESTION, SUBJECT, TOPIC, LECTURER, questionContent(), answerJson(), explanationJson());
    stemPng = png();
    solutionPng = png();
    figure(CONTENT_FIGURE, "stem.png", stemPng);
    figure(SOLUTION_FIGURE, "solution.png", solutionPng);
    http = JsonMapper.builder()
        .addModule(legacyJsonNodeModule)
        .addMixIn(ProblemDetail.class, ProblemDetailJacksonMixin.class)
        .disable(DateTimeFeature.WRITE_DATES_AS_TIMESTAMPS)
        .build();
    mvc = MockMvcBuilders.standaloneSetup(controller)
        .setControllerAdvice(errors)
        .setValidator(validator())
        .setMessageConverters(new ByteArrayHttpMessageConverter(), new JacksonJsonHttpMessageConverter(http))
        .build();
  }

  @AfterEach
  void clearUser() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void assemblePreviewPublishAndReleasedRead() throws Exception {
    authenticate(LECTURER, Role.LECTURER);
    MvcResult created = mvc.perform(post("/api/v1/exams")
            .contentType(MediaType.APPLICATION_JSON)
            .content(draftJson()))
        .andExpect(status().isCreated())
        .andReturn();
    JsonNode draft = http.readTree(created.getResponse().getContentAsString());
    String examId = draft.path("id").asText();
    assertThat(draft.path("version").asLong()).isZero();

    MvcResult plain = mvc.perform(get("/api/v1/exams/{examId}/preview", examId).param("solutions", "false"))
        .andExpect(status().isOk())
        .andReturn();
    assertUnpublished(plain);
    assertNoSolutionKeys(plain);
    assertNestedContent(plain);

    MvcResult solved = mvc.perform(get("/api/v1/exams/{examId}/preview", examId).param("solutions", "true"))
        .andExpect(status().isOk())
        .andReturn();
    assertUnpublished(solved);
    JsonNode solvedItem = item(solved);
    assertThat(solvedItem.path("answer").path("parts").get(0).path("partId").asText()).isEqualTo("p");
    assertThat(solvedItem.path("explanation").path("parts").get(0).path("solution").get(0)
            .path("figures").get(0).path("assetId").asText())
        .isEqualTo(SOLUTION_FIGURE.toString());
    assertThat(papers()).isZero();

    MvcResult published = mvc.perform(post("/api/v1/exams/{examId}/publish", examId)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"expectedVersion\":0}"))
        .andExpect(status().isOk())
        .andReturn();
    JsonNode paper = http.readTree(published.getResponse().getContentAsString());
    String paperId = paper.path("id").asText();
    assertThat(paper.path("versionNumber").asInt()).isEqualTo(1);
    assertThat(paper.path("publishedAt").isMissingNode() || paper.path("publishedAt").isNull()).isFalse();
    assertThat(paper.path("items").get(0).has("answer")).isTrue();
    assertThat(papers()).isEqualTo(1L);
    assertThat(solutionOnly(CONTENT_FIGURE)).isFalse();
    assertThat(solutionOnly(SOLUTION_FIGURE)).isTrue();
    mvc.perform(get("/api/v1/exams/papers/{paperId}/figures/{assetId}", paperId, SOLUTION_FIGURE))
        .andExpect(status().isOk())
        .andExpect(content().bytes(solutionPng));
    mvc.perform(get("/api/v1/exams/papers"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1));

    authenticate(STUDENT, Role.STUDENT);
    mvc.perform(get("/api/v1/exams/papers"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isEmpty());
    mvc.perform(get("/api/v1/exams/papers/{paperId}", paperId).param("solutions", "true"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
    mvc.perform(get("/api/v1/exams/papers/{paperId}/figures/{assetId}", paperId, CONTENT_FIGURE))
        .andExpect(status().isNotFound());

    clock.now = RELEASE.toInstant();
    mvc.perform(get("/api/v1/exams/papers"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(paperId))
        .andExpect(jsonPath("$[0].examId").value(examId))
        .andExpect(jsonPath("$[0].versionNumber").value(1))
        .andExpect(jsonPath("$[0].items").doesNotExist());
    MvcResult student = mvc.perform(get("/api/v1/exams/papers/{paperId}", paperId).param("solutions", "true"))
        .andExpect(status().isOk())
        .andReturn();
    assertNoSolutionKeys(student);
    assertNestedContent(student);
    assertThat(student.getResponse().getContentAsString()).doesNotContain(SOLUTION_FIGURE.toString());
    mvc.perform(get("/api/v1/exams/papers/{paperId}/figures/{assetId}", paperId, CONTENT_FIGURE))
        .andExpect(status().isOk())
        .andExpect(header().string("Cache-Control", "no-store"))
        .andExpect(header().string("X-Content-Type-Options", "nosniff"))
        .andExpect(content().contentTypeCompatibleWith(MediaType.IMAGE_PNG))
        .andExpect(content().bytes(stemPng));
    mvc.perform(get("/api/v1/exams/papers/{paperId}/figures/{assetId}", paperId, SOLUTION_FIGURE))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
  }

  @Test
  void publishedSnapshotSurvivesSourceEditsAndRejectsFrozenUpdates() throws Exception {
    authenticate(LECTURER, Role.LECTURER);
    String examId = createDraft(draftJson());
    String paperId = publish(examId, 0);
    UUID paper = UUID.fromString(paperId);
    byte[] replacement = stemPng.clone();
    replacement[replacement.length - 1] ^= 0x5A;
    jdbc.update(
        """
        UPDATE questions
        SET content_json = CAST(? AS jsonb), answer_json = CAST(? AS jsonb), explanation_json = CAST(? AS jsonb)
        WHERE id = ?
        """,
        "{\"title\":\"Mutated\",\"source\":\"mutated-secret\"}",
        "{\"parts\":[{\"partId\":\"p\",\"correctOptionIds\":[\"b\"]}]}",
        "{\"note\":\"mutated-secret\"}",
        QUESTION);
    jdbc.update("UPDATE question_figures SET content = ? WHERE id = ?", replacement, CONTENT_FIGURE);
    assertThat(jdbc.queryForObject("SELECT content_json->>'title' FROM questions WHERE id = ?", String.class, QUESTION))
        .isEqualTo("Mutated");
    assertThat(jdbc.queryForObject("SELECT content FROM question_figures WHERE id = ?", byte[].class, CONTENT_FIGURE))
        .isEqualTo(replacement);

    MvcResult staff = mvc.perform(get("/api/v1/exams/papers/{paperId}", paperId).param("solutions", "true"))
        .andExpect(status().isOk())
        .andReturn();
    String body = staff.getResponse().getContentAsString();
    JsonNode frozen = item(staff);
    assertThat(frozen.path("content").path("title").asText()).isEqualTo("Heat");
    assertThat(frozen.path("content").path("stem").get(0).path("source").asText()).isEqualTo("Hot plate");
    assertThat(frozen.path("answer").path("parts").get(0).path("correctOptionIds").get(0).asText()).isEqualTo("a");
    assertThat(body).doesNotContain("mutated-secret");
    assertThat(papers()).isEqualTo(1L);
    assertThat(jdbc.queryForObject(
            "SELECT content_json->>'title' FROM exam_paper_items WHERE paper_id = ?", String.class, paper))
        .isEqualTo("Heat");
    assertThat(paperFigure(paper, CONTENT_FIGURE)).isEqualTo(stemPng);
    assertThat(paperFigure(paper, SOLUTION_FIGURE)).isEqualTo(solutionPng);
    mvc.perform(get("/api/v1/exams/papers/{paperId}/figures/{assetId}", paperId, CONTENT_FIGURE))
        .andExpect(status().isOk())
        .andExpect(content().bytes(stemPng));

    assertThatThrownBy(() -> jdbc.update("UPDATE exam_papers SET title = ? WHERE id = ?", "Changed", paper))
        .isInstanceOf(DataAccessException.class);
    assertThatThrownBy(() -> jdbc.update("UPDATE exam_paper_items SET points = 9.00 WHERE paper_id = ?", paper))
        .isInstanceOf(DataAccessException.class);
    assertThatThrownBy(() -> jdbc.update(
            "UPDATE exam_paper_figures SET original_name = ? WHERE paper_id = ? AND asset_id = ?",
            "changed.png", paper, CONTENT_FIGURE))
        .isInstanceOf(DataAccessException.class);
    assertThat(jdbc.queryForObject("SELECT title FROM exam_papers WHERE id = ?", String.class, paper)).isEqualTo("Heat");
    assertThat(jdbc.queryForObject("SELECT points FROM exam_paper_items WHERE paper_id = ?", BigDecimal.class, paper))
        .isEqualByComparingTo("2.50");
    assertThat(jdbc.queryForObject(
            "SELECT original_name FROM exam_paper_figures WHERE paper_id = ? AND asset_id = ?",
            String.class, paper, CONTENT_FIGURE))
        .isEqualTo("stem.png");
    assertThat(paperFigure(paper, CONTENT_FIGURE)).isEqualTo(stemPng);
  }

  @Test
  void fixedClockUpdatesAndPublishIncrementOnceThenRejectStale() throws Exception {
    authenticate(LECTURER, Role.LECTURER);
    String examId = createDraft(draftJson());
    assertThat(examVersion(examId)).isZero();

    mvc.perform(patch("/api/v1/exams/{examId}", examId)
            .contentType(MediaType.APPLICATION_JSON)
            .content(savedDraft("2.50", 0)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.version").value(1))
        .andExpect(jsonPath("$.title").value("Heat"));
    assertThat(examVersion(examId)).isEqualTo(1L);

    mvc.perform(patch("/api/v1/exams/{examId}", examId)
            .contentType(MediaType.APPLICATION_JSON)
            .content(savedDraft("3.00", 1)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.version").value(2))
        .andExpect(jsonPath("$.items[0].partPoints.p").value(3.0));
    mvc.perform(get("/api/v1/exams/{examId}", examId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.version").value(2));
    assertThat(examVersion(examId)).isEqualTo(2L);

    mvc.perform(patch("/api/v1/exams/{examId}", examId)
            .contentType(MediaType.APPLICATION_JSON)
            .content(savedDraft("4.00", 1)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("RESOURCE_STATE_CONFLICT"));
    assertThat(examVersion(examId)).isEqualTo(2L);
    mvc.perform(get("/api/v1/exams/{examId}", examId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].partPoints.p").value(3.0));

    String paperId = publish(examId, 2);
    assertThat(examVersion(examId)).isEqualTo(3L);
    assertThat(latestPublished(examId)).isEqualTo(1);
    assertThat(papers()).isEqualTo(1L);
    mvc.perform(get("/api/v1/exams/{examId}", examId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.version").value(3))
        .andExpect(jsonPath("$.latestPublishedVersion").value(1));
    mvc.perform(post("/api/v1/exams/{examId}/publish", examId)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"expectedVersion\":2}"))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("RESOURCE_STATE_CONFLICT"));
    assertThat(examVersion(examId)).isEqualTo(3L);
    assertThat(latestPublished(examId)).isEqualTo(1);
    assertThat(papers()).isEqualTo(1L);
    assertThat(jdbc.queryForObject("SELECT version_number FROM exam_papers WHERE id = ?", Integer.class, UUID.fromString(paperId)))
        .isEqualTo(1);
  }

  @Test
  void duplicatePlacementsStoreOneFigureRowPerAsset() throws Exception {
    authenticate(LECTURER, Role.LECTURER);
    String examId = createDraft("""
        {"title":"Heat","subjectId":"%s","instructions":"Show the working","releaseAt":"2026-10-04T12:00:00Z",
         "items":[
           {"questionId":"%s","points":2.50,"partPoints":{"p":2.50},"instructions":"Keep units"},
           {"questionId":"%s","points":1.25,"partPoints":{"p":1.25},"instructions":"Second"}]}
        """.formatted(SUBJECT, QUESTION, QUESTION));
    String paperId = publish(examId, 0);
    UUID paper = UUID.fromString(paperId);
    mvc.perform(get("/api/v1/exams/papers/{paperId}", paperId).param("solutions", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items.length()").value(2))
        .andExpect(jsonPath("$.items[0].questionId").value(QUESTION.toString()))
        .andExpect(jsonPath("$.items[1].questionId").value(QUESTION.toString()))
        .andExpect(jsonPath("$.totalPoints").value(3.75));
    assertThat(jdbc.queryForObject("SELECT count(*) FROM exam_paper_items WHERE paper_id = ?", Long.class, paper))
        .isEqualTo(2L);
    assertThat(jdbc.queryForObject("SELECT count(*) FROM exam_paper_figures WHERE paper_id = ?", Long.class, paper))
        .isEqualTo(2L);
    assertThat(jdbc.queryForObject(
            "SELECT count(*) FROM exam_paper_figures WHERE paper_id = ? AND asset_id = ?",
            Long.class, paper, CONTENT_FIGURE)).isEqualTo(1L);
    assertThat(jdbc.queryForObject(
            "SELECT count(*) FROM exam_paper_figures WHERE paper_id = ? AND asset_id = ?",
            Long.class, paper, SOLUTION_FIGURE)).isEqualTo(1L);
    assertThat(solutionOnly(CONTENT_FIGURE)).isFalse();
    assertThat(solutionOnly(SOLUTION_FIGURE)).isTrue();
  }

  @Test
  void multipartWeightsStayByPartIdAndSecondPublishPreservesFirstVersion() throws Exception {
    authenticate(LECTURER, Role.LECTURER);
    jdbc.update(
        """
        UPDATE questions
        SET type = 'written_multipart', content_json = CAST(? AS jsonb),
            answer_json = CAST(? AS jsonb), explanation_json = CAST(? AS jsonb)
        WHERE id = ?
        """,
        multipartContent("First stem", "p2", "p1", "Part two", "Part one"),
        writtenAnswer(), writtenExplanation(), QUESTION);
    String examId = createDraft(multipartDraft("1.50", "2.50", null));
    mvc.perform(get("/api/v1/exams/{examId}", examId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].partPoints.p1").value(1.5))
        .andExpect(jsonPath("$.items[0].partPoints.p2").value(2.5));
    assertStoredWeight(examId, "1.50", "2.50");
    mvc.perform(get("/api/v1/exams/{examId}/preview", examId).param("solutions", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].content.parts[0].id").value("p2"))
        .andExpect(jsonPath("$.items[0].content.parts[1].id").value("p1"))
        .andExpect(jsonPath("$.items[0].partPoints.p1").value(1.5))
        .andExpect(jsonPath("$.items[0].partPoints.p2").value(2.5));

    String firstId = publish(examId, 0);
    UUID first = UUID.fromString(firstId);
    String firstJson = paperJson(first);
    byte[] firstBytes = paperFigure(first, CONTENT_FIGURE);
    assertPaperShape(first, "p2", "First stem", "1.50", "2.50");

    byte[] replacement = stemPng.clone();
    replacement[0] ^= 0x5A;
    jdbc.update(
        """
        UPDATE questions
        SET content_json = CAST(? AS jsonb)
        WHERE id = ?
        """,
        multipartContent("Second stem", "p1", "p2", "Later one", "Later two"), QUESTION);
    jdbc.update("UPDATE question_figures SET content = ? WHERE id = ?", replacement, CONTENT_FIGURE);
    mvc.perform(patch("/api/v1/exams/{examId}", examId)
            .contentType(MediaType.APPLICATION_JSON)
            .content(multipartDraft("1.00", "3.00", 1L)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.version").value(2))
        .andExpect(jsonPath("$.items[0].partPoints.p1").value(1.0))
        .andExpect(jsonPath("$.items[0].partPoints.p2").value(3.0));
    String secondId = publish(examId, 2);
    UUID second = UUID.fromString(secondId);

    assertThat(paperJson(first)).isEqualTo(firstJson);
    assertThat(paperFigure(first, CONTENT_FIGURE)).isEqualTo(firstBytes).isEqualTo(stemPng);
    assertPaperShape(first, "p2", "First stem", "1.50", "2.50");
    assertPaperShape(second, "p1", "Second stem", "1.00", "3.00");
    assertThat(paperFigure(second, CONTENT_FIGURE)).isEqualTo(replacement);
    assertThat(jdbc.queryForObject("SELECT version_number FROM exam_papers WHERE id = ?", Integer.class, first))
        .isEqualTo(1);
    assertThat(jdbc.queryForObject("SELECT version_number FROM exam_papers WHERE id = ?", Integer.class, second))
        .isEqualTo(2);
    assertThat(papers()).isEqualTo(2L);
    assertThat(latestPublished(examId)).isEqualTo(2);
  }

  @Test
  void missingReleasePublishesNothing() throws Exception {
    authenticate(LECTURER, Role.LECTURER);
    String examId = createDraft(unreleasedDraft());
    mvc.perform(post("/api/v1/exams/{examId}/publish", examId)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"expectedVersion\":0}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
        .andExpect(jsonPath("$.detail").value("Exam release time is required"));
    assertNothingPublished(examId);
  }

  @Test
  void disabledAndDeletedActorsPublishNothing() throws Exception {
    authenticate(LECTURER, Role.LECTURER);
    String examId = createDraft(draftJson());
    jdbc.update("UPDATE users SET status = 'DISABLED' WHERE id = ?", LECTURER);
    mvc.perform(post("/api/v1/exams/{examId}/publish", examId)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"expectedVersion\":0}"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("USER_DISABLED"));
    assertNothingPublished(examId);

    jdbc.update("UPDATE users SET status = 'ACTIVE', deleted_at = now() WHERE id = ?", LECTURER);
    mvc.perform(post("/api/v1/exams/{examId}/publish", examId)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"expectedVersion\":0}"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("USER_NOT_FOUND"));
    assertNothingPublished(examId);
  }

  @Test
  void disabledAndDeletedStudentReadsAreRejected() throws Exception {
    authenticate(LECTURER, Role.LECTURER);
    String examId = createDraft(draftJson());
    String paperId = publish(examId, 0);
    clock.now = RELEASE.toInstant();
    authenticate(STUDENT, Role.STUDENT);
    mvc.perform(get("/api/v1/exams/papers"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1));
    jdbc.update("UPDATE users SET status = 'DISABLED' WHERE id = ?", STUDENT);
    mvc.perform(get("/api/v1/exams/papers/{paperId}", paperId).param("solutions", "true"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("USER_DISABLED"));
    jdbc.update("UPDATE users SET status = 'ACTIVE', deleted_at = now() WHERE id = ?", STUDENT);
    mvc.perform(get("/api/v1/exams/papers"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("USER_NOT_FOUND"));
    assertThat(papers()).isEqualTo(1L);
    assertThat(examVersion(examId)).isEqualTo(1L);
  }

  @Test
  void forgedForeignLegacyAndDisabledPlacementLeaveNoPaper() throws Exception {
    authenticate(LECTURER, Role.LECTURER);
    jdbc.update(
        "UPDATE questions SET answer_json = CAST(? AS jsonb) WHERE id = ?",
        "{\"parts\":[{\"partId\":\"p\",\"correctOptionIds\":[\"a\",\"b\"]}]}", QUESTION);
    String forged = createDraft(draftJson());
    mvc.perform(post("/api/v1/exams/{examId}/publish", forged)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"expectedVersion\":0}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
        .andExpect(jsonPath("$.detail").value("Correct options are invalid"));
    assertNothingPublished(forged);

    jdbc.update("DELETE FROM exam_items WHERE exam_id = ?", UUID.fromString(forged));
    jdbc.update("DELETE FROM exams WHERE id = ?", UUID.fromString(forged));
    jdbc.update(
        "UPDATE questions SET content_json = CAST(? AS jsonb), answer_json = CAST(? AS jsonb) WHERE id = ?",
        questionContent().replace(CONTENT_FIGURE.toString(), "00000000-0000-0000-0000-0000000006ff"),
        answerJson(), QUESTION);
    mvc.perform(post("/api/v1/exams")
            .contentType(MediaType.APPLICATION_JSON)
            .content(draftJson()))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
        .andExpect(jsonPath("$.detail").value("Figure does not belong to this question"));
    assertThat(papers()).isZero();
    assertThat(jdbc.queryForObject("SELECT count(*) FROM exams", Long.class)).isZero();

    jdbc.update(
        "UPDATE questions SET content_json = CAST(? AS jsonb) WHERE id = ?", questionContent(), QUESTION);
    String disabled = createDraft(draftJson());
    jdbc.update("UPDATE subjects SET enabled = false WHERE id = ?", SUBJECT);
    mvc.perform(post("/api/v1/exams/{examId}/publish", disabled)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"expectedVersion\":0}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.detail").value("Subject and topic must be enabled"));
    assertNothingPublished(disabled);
    jdbc.update("UPDATE subjects SET enabled = true WHERE id = ?", SUBJECT);
    jdbc.update("UPDATE topics SET enabled = false WHERE id = ?", TOPIC);
    mvc.perform(post("/api/v1/exams/{examId}/publish", disabled)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"expectedVersion\":0}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.detail").value("Subject and topic must be enabled"));
    assertNothingPublished(disabled);

    jdbc.update("UPDATE topics SET enabled = true WHERE id = ?", TOPIC);
    UUID fileId = UUID.fromString("00000000-0000-0000-0000-000000000608");
    UUID assetId = UUID.fromString("00000000-0000-0000-0000-000000000609");
    jdbc.update("DELETE FROM question_assets WHERE question_id = ?", QUESTION);
    jdbc.update("DELETE FROM files WHERE id = ?", fileId);
    jdbc.update(
        """
        INSERT INTO files (id, storage_key, original_name, content_type, size, provider, folder)
        VALUES (?, 'legacy-solution-secret-url', 'secret.png', 'image/png', 4, 'test', 'legacy')
        """,
        fileId);
    jdbc.update(
        "INSERT INTO question_assets (id, question_id, file_id, role) VALUES (?, ?, ?, 'SOLUTION_IMAGE')",
        assetId, QUESTION, fileId);
    String legacyExam = createDraft(draftJson());
    String paperId = publish(legacyExam, 0);
    String body = mvc.perform(get("/api/v1/exams/papers/{paperId}", paperId).param("solutions", "true"))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();
    assertThat(body).doesNotContain("legacy-solution-secret-url").doesNotContain("\"assets\"");
    assertThat(jdbc.queryForObject(
            "SELECT content_json::text || answer_json::text || explanation_json::text FROM exam_paper_items WHERE paper_id = ?",
            String.class, UUID.fromString(paperId)))
        .doesNotContain("legacy-solution-secret-url");
  }

  @Test
  void nullPlacementAndEmptyPublishAreBadRequests() throws Exception {
    authenticate(LECTURER, Role.LECTURER);
    mvc.perform(post("/api/v1/exams")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"title":"Heat","subjectId":"%s","instructions":"Show the working","releaseAt":"2026-10-04T12:00:00Z",
                 "items":[null]}
                """.formatted(SUBJECT)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    assertThat(jdbc.queryForObject("SELECT count(*) FROM exams", Long.class)).isZero();
    assertThat(papers()).isZero();

    String examId = createDraft(draftJson());
    mvc.perform(post("/api/v1/exams/{examId}/publish", examId)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    assertNothingPublished(examId);
  }

  @Test
  void concurrentPublishOfSameVersionAllowsOne() throws Exception {
    authenticate(LECTURER, Role.LECTURER);
    String examId = createDraft(draftJson());
    var start = new CountDownLatch(1);
    var entered = new CountDownLatch(2);
    ExecutorService pool = Executors.newFixedThreadPool(2);
    boolean committed = false;
    try (Connection hold = dataSource.getConnection()) {
      hold.setAutoCommit(false);
      try (var lock = hold.prepareStatement("SELECT id FROM exams WHERE id = ? FOR UPDATE")) {
        lock.setObject(1, UUID.fromString(examId));
        try (var rows = lock.executeQuery()) {
          assertThat(rows.next()).isTrue();
        }
      }
      int holderPid = backendPid(hold);
      assertThat(holderPid).isPositive();
      var first = pool.submit(() -> publishAfter(examId, entered, start));
      var second = pool.submit(() -> publishAfter(examId, entered, start));
      try {
        assertThat(entered.await(20, TimeUnit.SECONDS)).isTrue();
        start.countDown();
        assertThat(awaitBlockedChain(holderPid, 2)).isTrue();
        assertThat(first.isDone()).isFalse();
        assertThat(second.isDone()).isFalse();
        hold.commit();
        committed = true;
        assertThat(first.get(20, TimeUnit.SECONDS) ^ second.get(20, TimeUnit.SECONDS)).isTrue();
      } finally {
        start.countDown();
        if (!committed) {
          hold.rollback();
        }
      }
    } finally {
      pool.shutdownNow();
      pool.awaitTermination(20, TimeUnit.SECONDS);
    }
    assertThat(papers()).isEqualTo(1L);
    assertThat(examVersion(examId)).isEqualTo(1L);
    assertThat(latestPublished(examId)).isEqualTo(1);
  }

  @Test
  void publishWaitsForQuestionLockAndKeepsThatSnapshot() throws Exception {
    authenticate(LECTURER, Role.LECTURER);
    String examId = createDraft(draftJson());
    byte[] lockedBytes = stemPng.clone();
    lockedBytes[0] ^= 0x5A;
    var finished = new CountDownLatch(1);
    var error = new AtomicReference<Throwable>();
    var paperId = new AtomicReference<String>();
    Thread publisher = new Thread(() -> {
      authenticate(LECTURER, Role.LECTURER);
      try {
        paperId.set(examService.publish(UUID.fromString(examId), new PublishExamRequest(0L)).id().toString());
      } catch (Throwable thrown) {
        error.set(thrown);
      } finally {
        finished.countDown();
      }
    });
    try (Connection hold = dataSource.getConnection()) {
      hold.setAutoCommit(false);
      try (var locked = hold.prepareStatement("SELECT id FROM questions WHERE id = ? FOR UPDATE")) {
        locked.setObject(1, QUESTION);
        try (var rows = locked.executeQuery()) {
          assertThat(rows.next()).isTrue();
        }
      }
      try (var update = hold.prepareStatement(
          "UPDATE questions SET content_json = CAST(? AS jsonb) WHERE id = ?")) {
        update.setString(1, questionContent().replace("Hot plate", "Locked plate"));
        update.setObject(2, QUESTION);
        update.executeUpdate();
      }
      try (var bytes = hold.prepareStatement("UPDATE question_figures SET content = ? WHERE id = ?")) {
        bytes.setBytes(1, lockedBytes);
        bytes.setObject(2, CONTENT_FIGURE);
        bytes.executeUpdate();
      }
      int holderPid = backendPid(hold);
      assertThat(holderPid).isPositive();
      publisher.start();
      assertThat(awaitBlockedBy(holderPid)).isTrue();
      hold.commit();
    } finally {
      publisher.join(20000);
    }
    assertThat(finished.await(5, TimeUnit.SECONDS)).isTrue();
    assertThat(error.get()).isNull();
    UUID paper = UUID.fromString(paperId.get());
    String frozen = jdbc.queryForObject(
        "SELECT content_json::text FROM exam_paper_items WHERE paper_id = ?", String.class, paper);
    assertThat(frozen).contains("Locked plate").doesNotContain("Hot plate");
    assertThat(paperFigure(paper, CONTENT_FIGURE)).isEqualTo(lockedBytes);

    byte[] later = lockedBytes.clone();
    later[1] ^= 0x11;
    jdbc.update(
        "UPDATE questions SET content_json = CAST(? AS jsonb) WHERE id = ?",
        questionContent().replace("Hot plate", "Later plate"), QUESTION);
    jdbc.update("UPDATE question_figures SET content = ? WHERE id = ?", later, CONTENT_FIGURE);
    assertThat(jdbc.queryForObject(
            "SELECT content_json::text FROM exam_paper_items WHERE paper_id = ?", String.class, paper))
        .contains("Locked plate")
        .doesNotContain("Later plate");
    assertThat(paperFigure(paper, CONTENT_FIGURE)).isEqualTo(lockedBytes);
  }

  @Test
  void figureInsertFaultRollsBackFlushedPaper() throws Exception {
    authenticate(LECTURER, Role.LECTURER);
    String examId = createDraft(draftJson());
    jdbc.execute("DROP TRIGGER IF EXISTS exam_test_reject_figure ON exam_paper_figures");
    jdbc.execute("""
        CREATE OR REPLACE FUNCTION exam_test_reject_figure_copy() RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RAISE EXCEPTION 'test figure copy rejected';
        END;
        $$
        """);
    jdbc.execute("""
        CREATE TRIGGER exam_test_reject_figure
        BEFORE INSERT ON exam_paper_figures
        FOR EACH ROW
        EXECUTE FUNCTION exam_test_reject_figure_copy()
        """);
    try {
      assertThatThrownBy(() -> examService.publish(UUID.fromString(examId), new PublishExamRequest(0L)))
          .isInstanceOf(RuntimeException.class);
      assertNothingPublished(examId);
    } finally {
      jdbc.execute("DROP TRIGGER IF EXISTS exam_test_reject_figure ON exam_paper_figures");
      jdbc.execute("DROP FUNCTION IF EXISTS exam_test_reject_figure_copy()");
    }
  }

  private void assertUnpublished(MvcResult result) throws Exception {
    JsonNode tree = http.readTree(result.getResponse().getContentAsString());
    assertThat(tree.path("id").isNull() || tree.path("id").isMissingNode()).isTrue();
    assertThat(tree.path("versionNumber").isNull() || tree.path("versionNumber").isMissingNode()).isTrue();
    assertThat(tree.path("publishedAt").isNull() || tree.path("publishedAt").isMissingNode()).isTrue();
  }

  private void assertNoSolutionKeys(MvcResult result) throws Exception {
    JsonNode node = item(result);
    assertThat(node.path("answer").isMissingNode()).isTrue();
    assertThat(node.path("explanation").isMissingNode()).isTrue();
  }

  private void assertNestedContent(MvcResult result) throws Exception {
    JsonNode node = item(result);
    assertThat(node.path("content").path("schemaVersion").asInt()).isEqualTo(1);
    assertThat(node.path("content").path("stem").get(1).path("figures").get(0).path("assetId").asText())
        .isEqualTo(CONTENT_FIGURE.toString());
    assertThat(new BigDecimal(node.path("partPoints").path("p").asText())).isEqualByComparingTo("2.50");
  }

  private JsonNode item(MvcResult result) throws Exception {
    return http.readTree(result.getResponse().getContentAsString()).path("items").get(0);
  }

  private long papers() {
    return jdbc.queryForObject("SELECT count(*) FROM exam_papers", Long.class);
  }

  private long examVersion(String examId) {
    return jdbc.queryForObject("SELECT version FROM exams WHERE id = ?", Long.class, UUID.fromString(examId));
  }

  private int latestPublished(String examId) {
    return jdbc.queryForObject(
        "SELECT latest_published_version FROM exams WHERE id = ?", Integer.class, UUID.fromString(examId));
  }

  private void assertNothingPublished(String examId) {
    assertThat(papers()).isZero();
    assertThat(jdbc.queryForObject("SELECT count(*) FROM exam_paper_items", Long.class)).isZero();
    assertThat(jdbc.queryForObject("SELECT count(*) FROM exam_paper_figures", Long.class)).isZero();
    assertThat(examVersion(examId)).isZero();
    var latest = jdbc.query(
        "SELECT latest_published_version FROM exams WHERE id = ?",
        (rs, row) -> rs.getObject(1),
        UUID.fromString(examId));
    assertThat(latest).hasSize(1);
    assertThat(latest.get(0)).isNull();
  }

  private boolean publishOnce(String examId) {
    authenticate(LECTURER, Role.LECTURER);
    try {
      examService.publish(UUID.fromString(examId), new PublishExamRequest(0L));
      return true;
    } catch (ApiException exception) {
      assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.RESOURCE_STATE_CONFLICT);
      return false;
    }
  }

  private boolean publishAfter(String examId, CountDownLatch entered, CountDownLatch start) throws Exception {
    authenticate(LECTURER, Role.LECTURER);
    entered.countDown();
    if (!start.await(20, TimeUnit.SECONDS)) {
      throw new IllegalStateException("Publish start barrier timed out");
    }
    return publishOnce(examId);
  }

  private static int backendPid(Connection connection) throws Exception {
    try (var pid = connection.prepareStatement("SELECT pg_backend_pid()")) {
      try (var rows = pid.executeQuery()) {
        if (!rows.next()) {
          return -1;
        }
        return rows.getInt(1);
      }
    }
  }

  private boolean awaitBlockedBy(int holderPid) throws Exception {
    return awaitBlockedChain(holderPid, 1);
  }

  private boolean awaitBlockedChain(int holderPid, int needed) throws Exception {
    for (int attempt = 0; attempt < 50; attempt++) {
      Long waiters = jdbc.queryForObject(
          """
          WITH RECURSIVE blocked_by_holder AS (
            SELECT blocked.pid
            FROM pg_stat_activity blocked
            WHERE blocked.wait_event_type = 'Lock'
              AND ? = ANY (pg_blocking_pids(blocked.pid))
            UNION
            SELECT blocked.pid
            FROM pg_stat_activity blocked
            JOIN blocked_by_holder parent ON parent.pid = ANY (pg_blocking_pids(blocked.pid))
            WHERE blocked.wait_event_type = 'Lock'
          )
          SELECT count(*) FROM blocked_by_holder
          """,
          Long.class, holderPid);
      if (waiters != null && waiters >= needed) {
        return true;
      }
      Thread.sleep(100);
    }
    throw new AssertionError(
        "holder " + holderPid + " needed " + needed + " lock waiters; " + lockWaits());
  }

  private String lockWaits() {
    return jdbc.query(
        """
        SELECT blocked.pid || ' ' || coalesce(blocked.wait_event_type, '') || ' '
            || coalesce(blocked.wait_event, '') || ' blockedBy=' || pg_blocking_pids(blocked.pid)::text
        FROM pg_stat_activity blocked
        WHERE blocked.wait_event_type = 'Lock'
           OR cardinality(pg_blocking_pids(blocked.pid)) > 0
        """,
        (rs, row) -> rs.getString(1)).toString();
  }

  private static LocalValidatorFactoryBean validator() {
    var validator = new LocalValidatorFactoryBean();
    validator.afterPropertiesSet();
    return validator;
  }

  private byte[] paperFigure(UUID paperId, UUID assetId) {
    return jdbc.queryForObject(
        "SELECT content FROM exam_paper_figures WHERE paper_id = ? AND asset_id = ?",
        byte[].class, paperId, assetId);
  }

  private String createDraft(String body) throws Exception {
    MvcResult created = mvc.perform(post("/api/v1/exams")
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isCreated())
        .andReturn();
    JsonNode draft = http.readTree(created.getResponse().getContentAsString());
    assertThat(draft.path("version").asLong()).isZero();
    return draft.path("id").asText();
  }

  private String publish(String examId, long expectedVersion) throws Exception {
    MvcResult published = mvc.perform(post("/api/v1/exams/{examId}/publish", examId)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"expectedVersion\":" + expectedVersion + "}"))
        .andExpect(status().isOk())
        .andReturn();
    return http.readTree(published.getResponse().getContentAsString()).path("id").asText();
  }

  private boolean solutionOnly(UUID assetId) {
    return Boolean.TRUE.equals(jdbc.queryForObject(
        "SELECT solution_only FROM exam_paper_figures WHERE asset_id = ?", Boolean.class, assetId));
  }

  private void figure(UUID id, String name, byte[] bytes) {
    jdbc.update(
        """
        INSERT INTO question_figures (id, question_id, original_name, content_type, size, content)
        VALUES (?, ?, ?, 'image/png', ?, ?)
        """,
        id, QUESTION, name, bytes.length, bytes);
  }

  private String draftJson() {
    return """
        {"title":"Heat","subjectId":"%s","instructions":"Show the working","releaseAt":"2026-10-04T12:00:00Z",
         "items":[{"questionId":"%s","points":2.50,"partPoints":{"p":2.50},"instructions":"Keep units"}]}
        """.formatted(SUBJECT, QUESTION);
  }

  private String unreleasedDraft() {
    return """
        {"title":"Heat","subjectId":"%s","instructions":"Show the working",
         "items":[{"questionId":"%s","points":2.50,"partPoints":{"p":2.50},"instructions":"Keep units"}]}
        """.formatted(SUBJECT, QUESTION);
  }

  private String savedDraft(String points, long expectedVersion) {
    return """
        {"title":"Heat","subjectId":"%s","instructions":"Show the working","releaseAt":"2026-10-04T12:00:00Z",
         "expectedVersion":%d,
         "items":[{"questionId":"%s","points":%s,"partPoints":{"p":%s},"instructions":"Keep units"}]}
        """.formatted(SUBJECT, expectedVersion, QUESTION, points, points);
  }

  private String questionContent() {
    return """
        {"schemaVersion":1,"title":"Heat","structure":"SINGLE",
         "stem":[{"id":"s","kind":"text","source":"Hot plate"},
           {"id":"g","kind":"figure_group","layout":"full_width",
            "figures":[{"assetId":"%s","alt":"plate","caption":""}]}],
         "parts":[{"id":"p","responseType":"SINGLE_CHOICE","prompt":[],"options":[
           {"id":"a","content":[{"id":"oa","kind":"text","source":"Up"}]},
           {"id":"b","content":[{"id":"ob","kind":"text","source":"Down"}]}]}]}
        """.formatted(CONTENT_FIGURE);
  }

  private String multipartContent(
      String stem, String firstId, String secondId, String firstPrompt, String secondPrompt) {
    return """
        {"schemaVersion":1,"title":"Heat","structure":"MULTIPART",
         "stem":[{"id":"s","kind":"text","source":"%s"},
           {"id":"g","kind":"figure_group","layout":"full_width",
            "figures":[{"assetId":"%s","alt":"plate","caption":""}]}],
         "parts":[
           {"id":"%s","responseType":"WRITTEN","prompt":[{"id":"a","kind":"text","source":"%s"}],"options":[]},
           {"id":"%s","responseType":"WRITTEN","prompt":[{"id":"b","kind":"text","source":"%s"}],"options":[]}]}
        """.formatted(stem, CONTENT_FIGURE, firstId, firstPrompt, secondId, secondPrompt);
  }

  private static String writtenAnswer() {
    return """
        {"parts":[{"partId":"p2","correctOptionIds":[]},{"partId":"p1","correctOptionIds":[]}]}
        """;
  }

  private static String writtenExplanation() {
    return """
        {"parts":[
          {"partId":"p2","solution":[{"id":"e2","kind":"text","source":"Work two"}],"rubric":"Two"},
          {"partId":"p1","solution":[{"id":"e1","kind":"text","source":"Work one"}],"rubric":"One"}]}
        """;
  }

  private String multipartDraft(String p1, String p2, Long expectedVersion) {
    String version = expectedVersion == null ? "" : ",\"expectedVersion\":" + expectedVersion;
    return """
        {"title":"Heat","subjectId":"%s","instructions":"Show the working","releaseAt":"2026-10-04T12:00:00Z"%s,
         "items":[{"questionId":"%s","points":4.00,"partPoints":{"p1":%s,"p2":%s},"instructions":"Keep units"}]}
        """.formatted(SUBJECT, version, QUESTION, p1, p2);
  }

  private void assertStoredWeight(String examId, String p1, String p2) {
    assertThat(weight("SELECT part_points->>'p1' FROM exam_items WHERE exam_id = ?", examId)).isEqualByComparingTo(p1);
    assertThat(weight("SELECT part_points->>'p2' FROM exam_items WHERE exam_id = ?", examId)).isEqualByComparingTo(p2);
  }

  private void assertPaperShape(UUID paperId, String firstPart, String stem, String p1, String p2) {
    assertThat(jdbc.queryForObject(
            "SELECT content_json->'parts'->0->>'id' FROM exam_paper_items WHERE paper_id = ?",
            String.class, paperId)).isEqualTo(firstPart);
    assertThat(jdbc.queryForObject(
            "SELECT content_json->'stem'->0->>'source' FROM exam_paper_items WHERE paper_id = ?",
            String.class, paperId)).isEqualTo(stem);
    assertThat(weight("SELECT part_points->>'p1' FROM exam_paper_items WHERE paper_id = ?", paperId))
        .isEqualByComparingTo(p1);
    assertThat(weight("SELECT part_points->>'p2' FROM exam_paper_items WHERE paper_id = ?", paperId))
        .isEqualByComparingTo(p2);
  }

  private BigDecimal weight(String sql, Object id) {
    Object key = id instanceof String text ? UUID.fromString(text) : id;
    return new BigDecimal(jdbc.queryForObject(sql, String.class, key));
  }

  private String paperJson(UUID paperId) {
    return jdbc.queryForObject(
        "SELECT content_json::text || answer_json::text || explanation_json::text FROM exam_paper_items WHERE paper_id = ?",
        String.class, paperId);
  }

  private static String answerJson() {
    return "{\"parts\":[{\"partId\":\"p\",\"correctOptionIds\":[\"a\"]}]}";
  }

  private String explanationJson() {
    return """
        {"parts":[{"partId":"p","solution":[{"id":"sg","kind":"figure_group","layout":"full_width",
          "figures":[{"assetId":"%s","alt":"work","caption":""}]}],"rubric":"Shown"}]}
        """.formatted(SOLUTION_FIGURE);
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
    MutableClock clock() {
      return new MutableClock();
    }

    @Bean
    CurrentUserProvider currentUserProvider() {
      return new ContextCurrentUserProvider();
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

  static final class MutableClock extends Clock {
    volatile Instant now = Instant.EPOCH;

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
}
