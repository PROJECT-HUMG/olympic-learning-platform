package me.nghlong3004.olympic.assessment.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManagerFactory;
import java.net.URI;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import me.nghlong3004.olympic.assessment.dto.AssessmentPage;
import me.nghlong3004.olympic.assessment.dto.ParsedAssessmentPage;
import me.nghlong3004.olympic.assessment.dto.ParsedQuestion;
import me.nghlong3004.olympic.assessment.properties.AssessmentImportProperties;
import me.nghlong3004.olympic.assessment.repository.AssessmentImportPageRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentImportRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftAssetRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftRepository;
import me.nghlong3004.olympic.assessment.service.AssessmentImportProcessor;
import me.nghlong3004.olympic.assessment.service.PdfDocumentReader;
import me.nghlong3004.olympic.assessment.service.VisionQuestionParser;
import me.nghlong3004.olympic.storage.dto.UploadedFile;
import me.nghlong3004.olympic.storage.enums.StorageFolder;
import me.nghlong3004.olympic.storage.enums.StorageProvider;
import me.nghlong3004.olympic.storage.mapper.FileMapper;
import me.nghlong3004.olympic.storage.repository.FileRepository;
import me.nghlong3004.olympic.storage.service.StorageCompensation;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.storage.service.impl.StorageUploadServiceImpl;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mapstruct.factory.Mappers;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.SharedEntityManagerCreator;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Isolated real PostgreSQL/Flyway/transaction proof with synthetic PDF, vision and storage
 * adapters. No application config, operator services or real provider is loaded.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/14/2026
 */
@Testcontainers(disabledWithoutDocker = true)
class AssessmentImportLifecycleIntegrationTest {
  @Container
  static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");

  @Container
  static final GenericContainer<?> REDIS =
      new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);

  private static LettuceConnectionFactory redisConnection;
  private static StringRedisTemplate redis;
  private static EntityManagerFactory entityManagerFactory;
  private static JdbcTemplate jdbc;
  private static JpaTransactionManager manager;
  private static AssessmentImportRepository imports;
  private static AssessmentImportPageRepository pages;
  private static AssessmentQuestionDraftRepository drafts;
  private static AssessmentQuestionDraftAssetRepository assets;
  private static FileRepository files;
  private static final FileMapper MAPPER = Mappers.getMapper(FileMapper.class);
  private StorageService storage;
  private PdfDocumentReader pdf;
  private VisionQuestionParser vision;
  private MutableClock clock;
  private AssessmentImportProcessorImpl processor;
  private UUID id;
  private UUID sourceId;

  @BeforeAll
  static void database() {
    redisConnection = new LettuceConnectionFactory(REDIS.getHost(), REDIS.getMappedPort(6379));
    redisConnection.afterPropertiesSet();
    redis = new StringRedisTemplate(redisConnection);
    var dataSource =
        new DriverManagerDataSource(
            POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
    Flyway.configure().dataSource(dataSource).locations("classpath:db/migration").load().migrate();
    var factory = new LocalContainerEntityManagerFactoryBean();
    factory.setDataSource(dataSource);
    factory.setPackagesToScan("me.nghlong3004.olympic");
    factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
    factory.setJpaPropertyMap(
        Map.of("hibernate.hbm2ddl.auto", "validate", "hibernate.show_sql", "false"));
    factory.afterPropertiesSet();
    entityManagerFactory = factory.getObject();
    manager = new JpaTransactionManager(entityManagerFactory);
    jdbc = new JdbcTemplate(dataSource);
    var repositories =
        new JpaRepositoryFactory(
            SharedEntityManagerCreator.createSharedEntityManager(entityManagerFactory));
    imports = repositories.getRepository(AssessmentImportRepository.class);
    pages = repositories.getRepository(AssessmentImportPageRepository.class);
    drafts = repositories.getRepository(AssessmentQuestionDraftRepository.class);
    assets = repositories.getRepository(AssessmentQuestionDraftAssetRepository.class);
    files = repositories.getRepository(FileRepository.class);
  }

  @AfterAll
  static void closeDatabase() {
    if (entityManagerFactory != null) {
      entityManagerFactory.close();
    }
    if (redisConnection != null) {
      redisConnection.destroy();
    }
  }

  @BeforeEach
  void fixture() {
    jdbc.execute("TRUNCATE assessment_imports, files, users CASCADE");
    try (var connection = redisConnection.getConnection()) {
      connection.serverCommands().flushAll();
    }
    id = UUID.randomUUID();
    sourceId = UUID.randomUUID();
    var user = UUID.randomUUID();
    jdbc.update(
        "INSERT INTO users (id,email,username,role,status) VALUES (?,?,?,'LECTURER','ACTIVE')",
        user,
        "fixture@example.test",
        "fixture");
    jdbc.update(
        "INSERT INTO files (id,storage_key,original_name,content_type,size,provider,folder) VALUES"
            + " (?,?,?,'application/pdf',1,'CLOUDINARY','ASSESSMENT_SOURCE')",
        sourceId,
        "source/original.pdf",
        "original.pdf");
    jdbc.update(
        "INSERT INTO assessment_imports (id,source_file_id,created_by,status,phase) VALUES"
            + " (?,?,?,'QUEUED','QUEUED')",
        id,
        sourceId,
        user);
    storage = mock(StorageService.class);
    pdf = mock(PdfDocumentReader.class);
    vision = mock(VisionQuestionParser.class);
    clock = new MutableClock();
    when(storage.download("source/original.pdf"))
        .thenAnswer(
            ignored -> {
              assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
              return new byte[] {1};
            });
    when(pdf.read(any())).thenReturn(List.of(page(1), page(2)));
    doAnswer(
            invocation -> {
              assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
              return parsed(invocation.getArgument(0));
            })
        .when(vision)
        .parse(any());
    when(storage.upload(any(byte[].class), anyString(), anyString(), any()))
        .thenAnswer(
            invocation ->
                new UploadedFile(
                    "generated/" + UUID.randomUUID() + ".png",
                    invocation.getArgument(1),
                    "image/png",
                    1,
                    StorageProvider.CLOUDINARY,
                    invocation.getArgument(3)));
    processor =
        new AssessmentImportProcessorImpl(
            imports,
            pages,
            drafts,
            assets,
            files,
            MAPPER,
            storage,
            new StorageCompensation(storage),
            pdf,
            vision,
            new ObjectMapper(),
            new AssessmentImportProperties(null, 25, 100),
            manager,
            clock);
  }

  @Test
  void concurrentClaimIsOnceAndProgressVisibleWhileProviderWaits() throws Exception {
    var entered = new CountDownLatch(1);
    var release = new CountDownLatch(1);
    doAnswer(
            invocation -> {
              assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
              var page = (AssessmentPage) invocation.getArgument(0);
              if (page.pageNumber() == 2) {
                entered.countDown();
                assertThat(release.await(10, TimeUnit.SECONDS)).isTrue();
              }
              return parsed(page);
            })
        .when(vision)
        .parse(any());
    try (var workers = Executors.newFixedThreadPool(2)) {
      var first = workers.submit(() -> processor.process(id));
      assertThat(entered.await(10, TimeUnit.SECONDS)).isTrue();
      workers.submit(() -> processor.process(id)).get(10, TimeUnit.SECONDS);
      assertThat(value("status", String.class)).isEqualTo("PROCESSING");
      assertThat(value("processed_pages", Integer.class)).isEqualTo(1);
      assertThat(value("progress", Integer.class)).isEqualTo(50);
      assertThat(value("attempt_count", Integer.class)).isEqualTo(1);
      release.countDown();
      first.get(10, TimeUnit.SECONDS);
    }
    assertThat(value("status", String.class)).isEqualTo("REVIEW_REQUIRED");
    processor.process(id);
    assertThat(value("attempt_count", Integer.class)).isEqualTo(1);
    jdbc.update("UPDATE assessment_imports SET status='PUBLISHED' WHERE id=?", id);
    processor.process(id);
    assertThat(value("status", String.class)).isEqualTo("PUBLISHED");
    assertThat(value("attempt_count", Integer.class)).isEqualTo(1);
  }

  @Test
  void partialFailureThenExplicitRetryReplacesChildrenWithoutCollisionsOrSourceDeletion() {
    doAnswer(
            invocation -> {
              var page = (AssessmentPage) invocation.getArgument(0);
              if (page.pageNumber() == 2) {
                throw new IllegalStateException("synthetic provider failure");
              }
              return parsed(page);
            })
        .when(vision)
        .parse(any());
    processor.process(id);
    assertThat(value("status", String.class)).isEqualTo("FAILED");
    assertThat(jdbc.queryForObject("SELECT count(*) FROM assessment_import_pages", Integer.class))
        .isEqualTo(1);
    String oldKey =
        jdbc.queryForObject("SELECT storage_key FROM files WHERE id<>?", String.class, sourceId);
    jdbc.update("UPDATE assessment_imports SET status='QUEUED',phase='QUEUED' WHERE id=?", id);
    doAnswer(invocation -> parsed(invocation.getArgument(0))).when(vision).parse(any());
    processor.process(id);
    assertThat(value("status", String.class)).isEqualTo("REVIEW_REQUIRED");
    assertThat(value("attempt_count", Integer.class)).isEqualTo(2);
    assertThat(jdbc.queryForObject("SELECT count(*) FROM assessment_import_pages", Integer.class))
        .isEqualTo(2);
    assertThat(
            jdbc.queryForObject("SELECT count(*) FROM assessment_question_drafts", Integer.class))
        .isEqualTo(2);
    assertThat(
            jdbc.queryForObject("SELECT count(*) FROM files WHERE id=?", Integer.class, sourceId))
        .isEqualTo(1);
    verify(storage).delete(oldKey);
    verify(storage, never()).delete("source/original.pdf");
  }

  @Test
  void durableQueuedReconciliationDoesNotNeedRedisAndExpiredWorkerRequiresRetry() {
    processor.reconcile();
    assertThat(value("status", String.class)).isEqualTo("REVIEW_REQUIRED");
    jdbc.update(
        "UPDATE assessment_imports SET"
            + " status='PROCESSING',phase='PARSING_QUESTIONS',lease_until=null WHERE id=?",
        id);
    processor.reconcile();
    assertThat(value("status", String.class)).isEqualTo("FAILED");
    assertThat(value("last_error", String.class)).contains("retry");
    assertThat(value("attempt_count", Integer.class)).isEqualTo(1);
  }

  @ParameterizedTest
  @ValueSource(booleans = {false, true})
  void expiredOldWorkerCannotWriteChildrenOrFailNewAttempt(boolean providerFails) throws Exception {
    var entered = new CountDownLatch(1);
    var release = new CountDownLatch(1);
    var calls = new AtomicInteger();
    doAnswer(
            invocation -> {
              if (calls.incrementAndGet() == 1) {
                entered.countDown();
                assertThat(release.await(10, TimeUnit.SECONDS)).isTrue();
                if (providerFails) {
                  throw new IllegalStateException("old provider failed");
                }
              }
              return parsed(invocation.getArgument(0));
            })
        .when(vision)
        .parse(any());
    try (var workers = Executors.newSingleThreadExecutor()) {
      var old = workers.submit(() -> processor.process(id));
      assertThat(entered.await(10, TimeUnit.SECONDS)).isTrue();
      clock.advance(Duration.ofMinutes(31));
      processor.reconcile();
      assertThat(value("status", String.class)).isEqualTo("FAILED");
      jdbc.update("UPDATE assessment_imports SET status='QUEUED' WHERE id=?", id);
      processor.process(id);
      release.countDown();
      old.get(10, TimeUnit.SECONDS);
    }
    assertThat(value("status", String.class)).isEqualTo("REVIEW_REQUIRED");
    assertThat(value("attempt_count", Integer.class)).isEqualTo(2);
    assertThat(jdbc.queryForObject("SELECT count(*) FROM assessment_import_pages", Integer.class))
        .isEqualTo(2);
  }

  @Test
  void generatedPageRollbackCompensatesUploadsAndKeepsFailureRetryable() {
    when(storage.upload(any(byte[].class), anyString(), anyString(), any()))
        .thenReturn(
            new UploadedFile(
                "generated/page.png",
                "x".repeat(300),
                "image/png",
                1,
                StorageProvider.CLOUDINARY,
                StorageFolder.ASSESSMENT_PAGE));
    processor.process(id);
    assertThat(value("status", String.class)).isEqualTo("FAILED");
    assertThat(jdbc.queryForObject("SELECT count(*) FROM assessment_import_pages", Integer.class))
        .isZero();
    verify(storage).delete("generated/page.png");
    assertThat(jdbc.queryForObject("SELECT count(*) FROM files", Integer.class)).isEqualTo(1);
  }

  @Test
  void genericStorageSuccessPersistsAndRollbackCompensatesEvenIfDeleteFails() {
    var upload = new MockMultipartFile("file", "image.png", "image/png", new byte[] {1});
    var uploaded =
        new UploadedFile(
            "generic/success.png",
            "image.png",
            "image/png",
            1,
            StorageProvider.CLOUDINARY,
            StorageFolder.POST);
    when(storage.upload(upload, StorageFolder.POST)).thenReturn(uploaded);
    when(storage.getDownloadUri(anyString())).thenReturn(URI.create("https://example.test/file"));
    var service =
        new StorageUploadServiceImpl(storage, files, MAPPER, new StorageCompensation(storage));
    var response = tx().execute(ignored -> service.upload(upload, StorageFolder.POST));
    assertThat(
            jdbc.queryForObject(
                "SELECT count(*) FROM files WHERE id=?", Integer.class, response.id()))
        .isEqualTo(1);
    verify(storage, never()).delete(uploaded.storageKey());
    when(storage.upload(upload, StorageFolder.POST))
        .thenReturn(
            new UploadedFile(
                "generic/failed.png",
                "x".repeat(300),
                "image/png",
                1,
                StorageProvider.CLOUDINARY,
                StorageFolder.POST));
    doThrow(new IllegalStateException("cleanup failure"))
        .when(storage)
        .delete("generic/failed.png");
    assertThatThrownBy(() -> tx().execute(ignored -> service.upload(upload, StorageFolder.POST)))
        .isNotNull()
        .satisfies(failure -> assertThat(failure.getMessage()).isNotEqualTo("cleanup failure"));
    verify(storage).delete("generic/failed.png");
  }

  @Test
  void afterCommitFailureNeverDeletesSuccessfullyCommittedBytes() {
    var upload = new MockMultipartFile("file", "image.png", "image/png", new byte[] {1});
    when(storage.upload(upload, StorageFolder.POST))
        .thenReturn(
            new UploadedFile(
                "generic/committed.png",
                "image.png",
                "image/png",
                1,
                StorageProvider.CLOUDINARY,
                StorageFolder.POST));
    when(storage.getDownloadUri(anyString())).thenReturn(URI.create("https://example.test/file"));
    var service =
        new StorageUploadServiceImpl(storage, files, MAPPER, new StorageCompensation(storage));
    assertThatThrownBy(
            () ->
                tx().execute(
                        ignored -> {
                          var response = service.upload(upload, StorageFolder.POST);
                          TransactionSynchronizationManager.registerSynchronization(
                              new TransactionSynchronization() {
                                @Override
                                public void afterCommit() {
                                  throw new IllegalStateException("after commit failure");
                                }
                              });
                          return response;
                        }))
        .hasMessage("after commit failure");
    assertThat(
            jdbc.queryForObject(
                "SELECT count(*) FROM files WHERE storage_key='generic/committed.png'",
                Integer.class))
        .isEqualTo(1);
    verify(storage, never()).delete("generic/committed.png");
  }

  @Test
  void redisDispatchIsAfterRealCommitAndRollbackEmitsNothing() throws Exception {
    var worker = mock(AssessmentImportProcessor.class);
    var queue = new RedisAssessmentImportQueue(redis, worker);
    queue.initializeGroup();
    var observer = Executors.newSingleThreadExecutor();
    try {
      doAnswer(
              invocation -> {
                assertThat(
                        observer
                            .submit(() -> value("status", String.class))
                            .get(10, TimeUnit.SECONDS))
                    .isEqualTo("QUEUED");
                return null;
              })
          .when(worker)
          .process(id);
      jdbc.update("UPDATE assessment_imports SET status='FAILED' WHERE id=?", id);
      tx().executeWithoutResult(
              ignored -> {
                jdbc.update("UPDATE assessment_imports SET status='QUEUED' WHERE id=?", id);
                queue.enqueue(id);
                assertThat(redis.opsForStream().size("olympic:assessment-imports")).isEqualTo(1);
                queue.consume();
                verify(worker, never()).process(id);
              });
      assertThat(redis.opsForStream().size("olympic:assessment-imports")).isEqualTo(2);
      queue.consume();
      verify(worker).process(id);
      var rolledBackId = UUID.randomUUID();
      assertThatThrownBy(
              () ->
                  tx().executeWithoutResult(
                          ignored -> {
                            queue.enqueue(rolledBackId);
                            throw new IllegalStateException("rollback");
                          }))
          .hasMessage("rollback");
      queue.consume();
      verify(worker, never()).process(rolledBackId);
    } finally {
      observer.shutdownNow();
    }
  }

  @Test
  void redisPendingDeliveryIsReadAgainAfterWorkerFailureAndAckedAfterSuccess() {
    var worker = mock(AssessmentImportProcessor.class);
    var queue = new RedisAssessmentImportQueue(redis, worker);
    queue.initializeGroup();
    doThrow(new IllegalStateException("synthetic crash")).doNothing().when(worker).process(id);
    queue.enqueue(id);
    queue.consume();
    queue.consume();
    verify(worker, times(2)).process(id);
    assertThat(
            redis
                .opsForStream()
                .pending("olympic:assessment-imports", "assessment-importers")
                .getTotalPendingMessages())
        .isZero();
  }

  @Test
  void failedRedisWakeupDoesNotRollbackCommittedJobAndDbReconciliationProcessesIt() {
    var unavailable = mock(StringRedisTemplate.class);
    when(unavailable.opsForStream()).thenThrow(new IllegalStateException("synthetic Redis outage"));
    var queue = new RedisAssessmentImportQueue(unavailable, processor);
    tx().executeWithoutResult(ignored -> queue.enqueue(id));
    assertThat(value("status", String.class)).isEqualTo("QUEUED");
    processor.reconcile();
    assertThat(value("status", String.class)).isEqualTo("REVIEW_REQUIRED");
  }

  private <T> T value(String column, Class<T> type) {
    return jdbc.queryForObject(
        "SELECT " + column + " FROM assessment_imports WHERE id=?", type, id);
  }

  private TransactionTemplate tx() {
    return new TransactionTemplate(manager);
  }

  private AssessmentPage page(int number) {
    return new AssessmentPage(number, new byte[] {1}, 10, 10, "Synthetic");
  }

  private ParsedAssessmentPage parsed(AssessmentPage page) {
    return new ParsedAssessmentPage(
        page.pageNumber(),
        List.of(new ParsedQuestion("1", null, null, .9, null, List.of(), List.of())));
  }

  private static final class MutableClock extends Clock {
    private volatile Instant instant = Instant.parse("2026-10-14T10:00:00Z");

    void advance(Duration duration) {
      instant = instant.plus(duration);
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
      return instant;
    }
  }
}
