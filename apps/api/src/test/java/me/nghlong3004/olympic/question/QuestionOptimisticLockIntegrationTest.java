package me.nghlong3004.olympic.question;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@DataJpaTest(
    properties = {"spring.jpa.hibernate.ddl-auto=validate", "spring.flyway.enabled=true"},
    showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Testcontainers(disabledWithoutDocker = true)
class QuestionOptimisticLockIntegrationTest {
  private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000101");
  private static final UUID SUBJECT_ID =
      UUID.fromString("00000000-0000-0000-0000-000000000102");
  private static final UUID TOPIC_ID = UUID.fromString("00000000-0000-0000-0000-000000000103");
  private static final UUID QUESTION_ID =
      UUID.fromString("00000000-0000-0000-0000-000000000104");

  @Container
  @ServiceConnection
  static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Autowired
  private QuestionRepository questionRepository;

  @Autowired
  private PlatformTransactionManager transactionManager;

  @BeforeEach
  void setUp() {
    jdbcTemplate.update("DELETE FROM questions WHERE id = ?", QUESTION_ID);
    jdbcTemplate.update("DELETE FROM topics WHERE id = ?", TOPIC_ID);
    jdbcTemplate.update("DELETE FROM subjects WHERE id = ?", SUBJECT_ID);
    jdbcTemplate.update("DELETE FROM users WHERE id = ?", USER_ID);
    jdbcTemplate.update(
        "INSERT INTO users (id, email, username, role, status) VALUES (?, ?, ?, 'LECTURER', 'ACTIVE')",
        USER_ID,
        "optimistic-lock@example.com",
        "optimistic-lock");
    jdbcTemplate.update(
        "INSERT INTO subjects (id, code, name, slug) VALUES (?, ?, ?, ?)",
        SUBJECT_ID,
        "OPT",
        "Optimistic Lock",
        "optimistic-lock");
    jdbcTemplate.update(
        "INSERT INTO topics (id, subject_id, name, slug) VALUES (?, ?, ?, ?)",
        TOPIC_ID,
        SUBJECT_ID,
        "Concurrency",
        "concurrency");
    jdbcTemplate.update(
        """
        INSERT INTO questions
          (id, subject_id, topic_id, created_by, status, type, content_json, answer_json,
           explanation_json, version)
        VALUES (?, ?, ?, ?, 'DRAFT', 'multiple_choice', CAST(? AS jsonb), CAST(? AS jsonb),
                CAST(? AS jsonb), 0)
        """,
        QUESTION_ID,
        SUBJECT_ID,
        TOPIC_ID,
        USER_ID,
        "{\"text\":\"Question\"}",
        "{\"value\":\"Answer\"}",
        "{}");
  }

  @Test
  void rejectsStaleQuestionUpdate() {
    var firstCopy = findQuestionInNewTransaction();
    var staleCopy = findQuestionInNewTransaction();

    firstCopy.setStatus(QuestionStatus.PUBLISHED);
    saveInNewTransaction(firstCopy);

    staleCopy.setStatus(QuestionStatus.ARCHIVED);

    assertThatThrownBy(() -> saveInNewTransaction(staleCopy))
        .isInstanceOf(OptimisticLockingFailureException.class);
    assertThat(questionRepository.findById(QUESTION_ID).orElseThrow().getStatus())
        .isEqualTo(QuestionStatus.PUBLISHED);
  }

  private Question findQuestionInNewTransaction() {
    return new TransactionTemplate(transactionManager).execute(
        ignored -> questionRepository.findById(QUESTION_ID).orElseThrow());
  }

  private void saveInNewTransaction(Question question) {
    new TransactionTemplate(transactionManager).executeWithoutResult(
        ignored -> questionRepository.saveAndFlush(question));
  }
}
