package me.nghlong3004.olympic.question;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import me.nghlong3004.olympic.question.entity.Question;
import me.nghlong3004.olympic.question.enums.QuestionStatus;
import me.nghlong3004.olympic.question.repository.QuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * A null search stays varchar on PostgreSQL. Omitted search returns the lecturer shared bank and
 * the full admin page. A present fragment matches, and an absent fragment is empty.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@DataJpaTest(
    properties = {"spring.jpa.hibernate.ddl-auto=validate", "spring.flyway.enabled=true"},
    showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Testcontainers(disabledWithoutDocker = true)
class QuestionSearchBindingIntegrationTest {
  private static final UUID LECTURER = UUID.fromString("00000000-0000-0000-0000-000000000c01");
  private static final UUID OTHER = UUID.fromString("00000000-0000-0000-0000-000000000c02");
  private static final UUID ADMIN = UUID.fromString("00000000-0000-0000-0000-000000000c03");
  private static final UUID SUBJECT = UUID.fromString("00000000-0000-0000-0000-000000000c11");
  private static final UUID TOPIC = UUID.fromString("00000000-0000-0000-0000-000000000c12");
  private static final UUID PUBLISHED = UUID.fromString("00000000-0000-0000-0000-000000000c21");
  private static final UUID OWN_DRAFT = UUID.fromString("00000000-0000-0000-0000-000000000c22");
  private static final UUID OTHER_DRAFT = UUID.fromString("00000000-0000-0000-0000-000000000c23");

  @Container
  @ServiceConnection
  static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");

  @Autowired private JdbcTemplate jdbc;
  @Autowired private QuestionRepository questions;

  @BeforeEach
  void seed() {
    jdbc.update("DELETE FROM questions WHERE id IN (?,?,?)", PUBLISHED, OWN_DRAFT, OTHER_DRAFT);
    jdbc.update("DELETE FROM topics WHERE id = ?", TOPIC);
    jdbc.update("DELETE FROM subjects WHERE id = ?", SUBJECT);
    jdbc.update("DELETE FROM users WHERE id IN (?,?,?)", LECTURER, OTHER, ADMIN);
    insertLecturer(LECTURER, "search-lecturer@example.com", "search-lecturer");
    insertLecturer(OTHER, "search-other@example.com", "search-other");
    insertAdmin(ADMIN, "search-admin@example.com", "search-admin");
    jdbc.update(
        "INSERT INTO subjects (id, code, name, slug) VALUES (?, 'SRB', 'Search Binding', 'search-binding')",
        SUBJECT);
    jdbc.update(
        "INSERT INTO topics (id, subject_id, name, slug) VALUES (?, ?, 'Binding', 'binding')",
        TOPIC, SUBJECT);
    insertQuestion(PUBLISHED, OTHER, "PUBLISHED", "{\"text\":\"Visible Photon Stem\"}");
    insertQuestion(OWN_DRAFT, LECTURER, "DRAFT", "{\"text\":\"Own draft marker\"}");
    insertQuestion(OTHER_DRAFT, OTHER, "DRAFT", "{\"text\":\"Hidden other draft\"}");
  }

  @Test
  void nullSearchReturnsSharedBankAndFragmentFilters() {
    assertThat(search(LECTURER, null).map(Question::getId))
        .containsExactlyInAnyOrder(PUBLISHED, OWN_DRAFT);
    assertThat(search(null, null).map(Question::getId))
        .containsExactlyInAnyOrder(PUBLISHED, OWN_DRAFT, OTHER_DRAFT);
    assertThat(search(LECTURER, "photon").map(Question::getId)).containsExactly(PUBLISHED);
    assertThat(search(null, "photon").map(Question::getId)).containsExactly(PUBLISHED);
    assertThat(search(LECTURER, "absent-fragment")).isEmpty();
    assertThat(search(null, "absent-fragment")).isEmpty();
  }

  private Page<Question> search(UUID ownerId, String term) {
    return questions.search(
        ownerId, QuestionStatus.PUBLISHED, null, null, null, term, PageRequest.of(0, 20));
  }

  private void insertLecturer(UUID id, String email, String username) {
    jdbc.update(
        "INSERT INTO users (id, email, username, role, status) VALUES (?, ?, ?, 'LECTURER', 'ACTIVE')",
        id, email, username);
  }

  private void insertAdmin(UUID id, String email, String username) {
    jdbc.update(
        "INSERT INTO users (id, email, username, role, status) VALUES (?, ?, ?, 'ADMIN', 'ACTIVE')",
        id, email, username);
  }

  private void insertQuestion(UUID id, UUID authorId, String status, String content) {
    jdbc.update(
        """
        INSERT INTO questions
          (id, subject_id, topic_id, created_by, status, type, content_json, answer_json, explanation_json, version)
        VALUES (?, ?, ?, ?, ?, 'written', CAST(? AS jsonb), CAST('{}' AS jsonb), CAST('{}' AS jsonb), 0)
        """,
        id, SUBJECT, TOPIC, authorId, status, content);
  }
}
