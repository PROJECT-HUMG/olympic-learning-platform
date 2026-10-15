package me.nghlong3004.olympic.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Properties;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Fresh Flyway/JPA and database-invariant proof in an owned disposable schema. By default uses
 * Testcontainers; a disposable local PostgreSQL can be supplied with migrationTest.jdbcUrl/user.
 * Never cleans or baselines an existing schema, and never loads application/provider configuration.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/15/2026
 */
class FlywayBaselineIntegrationTest {
  private static PostgreSQLContainer postgres;
  private static DriverManagerDataSource dataSource;
  private static JdbcTemplate admin;
  private static JdbcTemplate jdbc;
  private static String schema;
  private static Flyway flyway;

  @BeforeAll
  static void database() {
    var url = System.getProperty("migrationTest.jdbcUrl");
    var user = System.getProperty("migrationTest.user", "postgres");
    var password = System.getProperty("migrationTest.password", "");
    if (url == null) {
      assumeTrue(DockerClientFactory.instance().isDockerAvailable(), "Docker unavailable");
      postgres = new PostgreSQLContainer("postgres:16-alpine");
      postgres.start();
      url = postgres.getJdbcUrl();
      user = postgres.getUsername();
      password = postgres.getPassword();
    }
    admin = new JdbcTemplate(new DriverManagerDataSource(url, user, password));
    schema = "baseline_test_" + UUID.randomUUID().toString().replace("-", "");
    admin.execute("CREATE SCHEMA " + schema);
    dataSource = new DriverManagerDataSource(url, user, password);
    var properties = new Properties();
    properties.setProperty("currentSchema", schema);
    dataSource.setConnectionProperties(properties);
    jdbc = new JdbcTemplate(dataSource);
    flyway = Flyway.configure().dataSource(dataSource).defaultSchema(schema).load();
    assertThat(flyway.migrate().migrationsExecuted).isEqualTo(1);
  }

  @AfterAll
  static void closeDatabase() {
    if (admin != null && schema != null) {
      // Only this randomly named test schema; no public/operator schema or Flyway.clean().
      admin.execute("DROP SCHEMA " + schema + " CASCADE");
    }
    if (postgres != null) {
      postgres.stop();
    }
  }

  @Test
  void baselineValidatesEveryJpaEntityAndReopensWithoutReapplying() {
    var factory = new LocalContainerEntityManagerFactoryBean();
    factory.setDataSource(dataSource);
    factory.setPackagesToScan("me.nghlong3004.olympic");
    factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
    factory.setJpaPropertyMap(Map.of("hibernate.hbm2ddl.auto", "validate"));
    try {
      factory.afterPropertiesSet();
      assertThat(factory.getObject()).isNotNull();
    } finally {
      factory.destroy();
    }
    flyway.validate();
    assertThat(flyway.migrate().migrationsExecuted).isZero();
    assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("1");
    assertThat(
            jdbc.queryForObject(
                "SELECT count(*) FROM flyway_schema_history WHERE success", Integer.class))
        .isEqualTo(1);
  }

  @Test
  void finalEnumsDefaultsAndDeferredOrderingRemainAvailable() {
    assertThat(jdbc.queryForObject("SELECT enum_range(NULL::post_type)::text", String.class))
        .isEqualTo("{NEWS,ANNOUNCEMENT,BLOG}");
    assertThat(jdbc.queryForObject("SELECT enum_range(NULL::post_status)::text", String.class))
        .isEqualTo("{DRAFT,PUBLISHED,ARCHIVED}");
    assertThat(
            jdbc.queryForObject(
                "SELECT condeferrable AND condeferred FROM pg_constraint WHERE"
                    + " conrelid='daily_tasks'::regclass AND conname='uk_daily_task_plan_position'",
                Boolean.class))
        .isTrue();
    assertThat(
            jdbc.queryForObject(
                "SELECT column_default FROM information_schema.columns WHERE table_schema=?"
                    + " AND table_name='recognition_achievements' AND column_name='public_visible'",
                String.class,
                schema))
        .isEqualTo("true");
    assertThat(
            jdbc.queryForObject(
                "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE"
                    + " conrelid='daily_evidence'::regclass AND"
                    + " conname='daily_evidence_stage_check'",
                String.class))
        .contains("GENERAL", "START", "FINISH");
    var user = user();
    assertThat(jdbc.queryForObject("SELECT status::text FROM users WHERE id=?", String.class, user))
        .isEqualTo("PENDING");
    assertThatThrownBy(
            () ->
                jdbc.update(
                    "UPDATE users SET avatar_crop_x=2,avatar_crop_y=0,avatar_crop_zoom=1 WHERE"
                        + " id=?",
                    user))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void evidenceBytesAndFrozenExamMutationsRemainDatabaseProtected() {
    var user = user();
    var subject = UUID.randomUUID();
    var topic = UUID.randomUUID();
    var question = UUID.randomUUID();
    var exam = UUID.randomUUID();
    var paper = UUID.randomUUID();
    jdbc.update(
        "INSERT INTO subjects(id,code,name,slug) VALUES (?,?,'Fixture',?)",
        subject,
        subject.toString(),
        subject.toString());
    jdbc.update(
        "INSERT INTO topics(id,subject_id,name,slug) VALUES (?,?,'Fixture','fixture')",
        topic,
        subject);
    jdbc.update(
        "INSERT INTO questions(id,subject_id,topic_id,created_by,type) VALUES"
            + " (?,?,?,?,'SINGLE_CHOICE')",
        question,
        subject,
        topic,
        user);
    assertThat(
            jdbc.queryForObject("SELECT version FROM questions WHERE id=?", Long.class, question))
        .isZero();
    jdbc.update(
        "INSERT INTO exams(id,subject_id,created_by,title,instructions) VALUES"
            + " (?,?,?,'Fixture','')",
        exam,
        subject,
        user);
    jdbc.update(
        "INSERT INTO"
            + " exam_papers(id,exam_id,version_number,title,subject_id,instructions,release_at,published_at,total_points,created_by)"
            + " VALUES (?,?,1,'Fixture',?,'',now(),now(),1,?)",
        paper,
        exam,
        subject,
        user);
    jdbc.update(
        "INSERT INTO"
            + " exam_paper_items(id,paper_id,position,question_id,points,part_points,instructions,content_json,answer_json,explanation_json)"
            + " VALUES (?,?,0,?,1,'{}','','{}','{}','{}')",
        UUID.randomUUID(),
        paper,
        question);
    jdbc.update(
        "INSERT INTO"
            + " exam_paper_figures(id,paper_id,asset_id,question_id,original_name,content_type,size,content,solution_only)"
            + " VALUES (?,?,?,?,'fixture.png','image/png',1,?,false)",
        UUID.randomUUID(),
        paper,
        UUID.randomUUID(),
        question,
        new byte[] {1});
    for (var table : new String[] {"exam_papers", "exam_paper_items", "exam_paper_figures"}) {
      assertThatThrownBy(() -> jdbc.execute("UPDATE " + table + " SET id=id"))
          .hasMessageContaining("published exam version is immutable");
    }
    var plan = UUID.randomUUID();
    var task = UUID.randomUUID();
    jdbc.update(
        "INSERT INTO daily_plans(id,owner_id,plan_date,created_at,updated_at,version) VALUES"
            + " (?,?,CURRENT_DATE,now(),now(),0)",
        plan,
        user);
    jdbc.update(
        "INSERT INTO daily_tasks(id,plan_id,position,title,priority,status) VALUES"
            + " (?,?,0,'Fixture','MUST','TODO')",
        task,
        plan);
    jdbc.update(
        "INSERT INTO"
            + " daily_evidence(id,task_id,stage,kind,original_name,content_type,size_bytes,content,created_at)"
            + " VALUES (?,?,'GENERAL','FILE','fixture.png','image/png',1,?,now())",
        UUID.randomUUID(),
        task,
        new byte[] {1});
    assertThatThrownBy(
            () -> jdbc.update("UPDATE daily_evidence SET size_bytes=2 WHERE task_id=?", task))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void replayPreservesVisibilityOptOutWithoutApprovingOrEnrolling() {
    var user = user();
    var achievement = UUID.randomUUID();
    jdbc.update(
        "INSERT INTO"
            + " recognition_achievements(id,user_id,title,category,award,include_participation,"
            + "achieved_date,status,award_points,participation_points,submitted_by,created_at,updated_at)"
            + " VALUES"
            + " (?,?,'Fixture','OLYMPIC_SCHOOL','FIRST',false,CURRENT_DATE,'PENDING',1,0,?,now(),now())",
        achievement,
        user,
        user);
    assertThat(
            jdbc.queryForObject(
                "SELECT public_visible FROM recognition_achievements WHERE id=?",
                Boolean.class,
                achievement))
        .isTrue();
    jdbc.update(
        "UPDATE recognition_achievements SET public_visible=false,version=7 WHERE id=?",
        achievement);
    assertThat(flyway.migrate().migrationsExecuted).isZero();
    assertThat(
            jdbc.queryForObject(
                "SELECT public_visible FROM recognition_achievements WHERE id=?",
                Boolean.class,
                achievement))
        .isFalse();
    assertThat(
            jdbc.queryForObject(
                "SELECT version FROM recognition_achievements WHERE id=?", Long.class, achievement))
        .isEqualTo(7);
    assertThat(
            jdbc.queryForObject(
                "SELECT status FROM recognition_achievements WHERE id=?",
                String.class,
                achievement))
        .isEqualTo("PENDING");
    assertThat(jdbc.queryForObject("SELECT count(*) FROM recognition_preferences", Integer.class))
        .isZero();
  }

  @Test
  void refusesNonemptyUntrackedAndLegacyRecordedSchemas(@TempDir Path legacy) throws Exception {
    var other = schema + "_legacy";
    admin.execute("CREATE SCHEMA " + other);
    try {
      admin.execute("CREATE TABLE " + other + ".operator_probe(value text)");
      var candidate = Flyway.configure().dataSource(dataSource).defaultSchema(other).load();
      assertThatThrownBy(candidate::migrate).isInstanceOf(FlywayException.class);
      assertThat(
              admin.queryForObject(
                  "SELECT count(*) FROM " + other + ".operator_probe", Integer.class))
          .isZero();
      Files.writeString(legacy.resolve("V1__legacy.sql"), "CREATE TABLE legacy_probe(value text);");
      // An explicit synthetic old history is created only inside this owned test schema.
      admin.execute("DROP TABLE " + other + ".operator_probe");
      Flyway.configure()
          .dataSource(dataSource)
          .defaultSchema(other)
          .locations("filesystem:" + legacy)
          .load()
          .migrate();
      assertThatThrownBy(candidate::migrate).isInstanceOf(FlywayException.class);
      assertThat(
              admin.queryForObject(
                  "SELECT count(*) FROM " + other + ".legacy_probe", Integer.class))
          .isZero();
    } finally {
      admin.execute("DROP SCHEMA " + other + " CASCADE");
    }
  }

  private UUID user() {
    var id = UUID.randomUUID();
    jdbc.update(
        "INSERT INTO users(id,email,username) VALUES (?,?,?)",
        id,
        id + "@example.test",
        id.toString());
    return id;
  }
}
