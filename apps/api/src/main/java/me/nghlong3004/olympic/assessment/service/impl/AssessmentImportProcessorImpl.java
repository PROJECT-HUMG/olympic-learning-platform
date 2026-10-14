package me.nghlong3004.olympic.assessment.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;
import javax.imageio.ImageIO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.assessment.dto.AssessmentBoundingBox;
import me.nghlong3004.olympic.assessment.dto.ParsedQuestion;
import me.nghlong3004.olympic.assessment.entity.AssessmentImport;
import me.nghlong3004.olympic.assessment.entity.AssessmentImportPage;
import me.nghlong3004.olympic.assessment.entity.AssessmentQuestionDraft;
import me.nghlong3004.olympic.assessment.entity.AssessmentQuestionDraftAsset;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportPhase;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportStatus;
import me.nghlong3004.olympic.assessment.properties.AssessmentImportProperties;
import me.nghlong3004.olympic.assessment.repository.AssessmentImportPageRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentImportRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftAssetRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftRepository;
import me.nghlong3004.olympic.assessment.service.AssessmentImportProcessor;
import me.nghlong3004.olympic.assessment.service.PdfDocumentReader;
import me.nghlong3004.olympic.assessment.service.VisionQuestionParser;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.storage.dto.UploadedFile;
import me.nghlong3004.olympic.storage.entity.File;
import me.nghlong3004.olympic.storage.enums.StorageFolder;
import me.nghlong3004.olympic.storage.mapper.FileMapper;
import me.nghlong3004.olympic.storage.repository.FileRepository;
import me.nghlong3004.olympic.storage.service.StorageCompensation;
import me.nghlong3004.olympic.storage.service.StorageService;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Database-authoritative import attempts. Provider work never holds a database transaction. A lease
 * bounds abandoned work; attemptCount fences every subsequent write against old workers.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AssessmentImportProcessorImpl implements AssessmentImportProcessor {
  private static final Duration LEASE = Duration.ofMinutes(30);
  private static final int RECOVERY_BATCH_SIZE = 10;

  private final AssessmentImportRepository importRepository;
  private final AssessmentImportPageRepository pageRepository;
  private final AssessmentQuestionDraftRepository draftRepository;
  private final AssessmentQuestionDraftAssetRepository assetRepository;
  private final FileRepository fileRepository;
  private final FileMapper fileMapper;
  private final StorageService storageService;
  private final StorageCompensation compensation;
  private final PdfDocumentReader pdfDocumentReader;
  private final VisionQuestionParser visionQuestionParser;
  private final ObjectMapper objectMapper;
  private final AssessmentImportProperties properties;
  private final PlatformTransactionManager transactionManager;
  private final Clock clock;

  @Override
  public void process(UUID importId) {
    var attempt = transactions().execute(ignored -> claim(importId));
    if (attempt == null) {
      return;
    }
    try {
      processInternal(attempt);
    } catch (AttemptLostException lost) {
      log.info(
          "Assessment import worker fenced: importId={}, attempt={}", importId, attempt.number());
    } catch (Exception failure) {
      update(
          attempt,
          job -> {
            job.setStatus(AssessmentImportStatus.FAILED);
            job.setPhase(AssessmentImportPhase.FAILED);
            job.setLeaseUntil(null);
            // Provider exception messages can contain URLs/credentials; keep public status generic.
            job.setLastError("Import processing failed; retry is available");
          },
          false);
      log.error("Assessment import failed: importId={}, attempt={}", importId, attempt.number());
    }
  }

  /** Bounded durable reconciliation also works when Redis is unavailable or loses an ACK. */
  @Scheduled(fixedDelay = 5000)
  public void reconcile() {
    var ids =
        transactions()
            .execute(
                ignored ->
                    importRepository.findRecoverableIds(
                        AssessmentImportStatus.QUEUED,
                        AssessmentImportStatus.PROCESSING,
                        now(),
                        PageRequest.of(0, RECOVERY_BATCH_SIZE)));
    for (var id : ids) {
      try {
        process(id);
      } catch (RuntimeException failure) {
        log.error("Assessment import reconciliation failed: importId={}", id);
      }
    }
  }

  private Attempt claim(UUID id) {
    var job = importRepository.findForUpdateById(id).orElse(null);
    if (job == null) {
      return null;
    }
    if (job.getStatus() == AssessmentImportStatus.PROCESSING
        && (job.getLeaseUntil() == null || !job.getLeaseUntil().isAfter(now()))) {
      job.setStatus(AssessmentImportStatus.FAILED);
      job.setPhase(AssessmentImportPhase.FAILED);
      job.setLeaseUntil(null);
      job.setLastError("Import worker interrupted; retry is available");
      return null;
    }
    if (job.getStatus() != AssessmentImportStatus.QUEUED) {
      return null;
    }
    // No review/published job can enter replacement. Child rows disappear before reused ordinals.
    clearPreviousAttempt(job);
    job.setStatus(AssessmentImportStatus.PROCESSING);
    job.setPhase(AssessmentImportPhase.RENDERING_PAGES);
    job.setAttemptCount(job.getAttemptCount() + 1);
    job.setLeaseUntil(now().plus(LEASE));
    job.setTotalPages(0);
    job.setProcessedPages(0);
    job.setDraftCount(0);
    job.setWarningCount(0);
    job.setProgress(0);
    job.setLastError(null);
    log.info("Assessment import claimed: importId={}, attempt={}", id, job.getAttemptCount());
    return new Attempt(id, job.getAttemptCount(), job.getSourceFile().getStorageKey());
  }

  private void clearPreviousAttempt(AssessmentImport job) {
    var drafts = draftRepository.findByAssessmentImportIdOrderByOrdinalAsc(job.getId());
    var assets =
        drafts.isEmpty()
            ? List.<AssessmentQuestionDraftAsset>of()
            : assetRepository.findByDraftIdInOrderByDraftIdAscSortOrderAsc(
                drafts.stream().map(AssessmentQuestionDraft::getId).toList());
    var pages = pageRepository.findByAssessmentImportIdOrderByPageNumberAsc(job.getId());
    var files = new LinkedHashMap<UUID, File>();
    assets.forEach(asset -> files.put(asset.getFile().getId(), asset.getFile()));
    pages.forEach(page -> files.put(page.getFile().getId(), page.getFile()));
    files.remove(job.getSourceFile().getId());
    assetRepository.deleteAll(assets);
    assetRepository.flush();
    draftRepository.deleteAll(drafts);
    draftRepository.flush();
    pageRepository.deleteAll(pages);
    pageRepository.flush();
    fileRepository.deleteAll(files.values());
    fileRepository.flush();
    compensation.afterCommit(files.values().stream().map(File::getStorageKey).toList());
  }

  private void processInternal(Attempt attempt) {
    var source = storageService.download(attempt.sourceKey());
    phase(attempt, AssessmentImportPhase.EXTRACTING_TEXT);
    var pages = pdfDocumentReader.read(source);
    if (pages.isEmpty()) {
      throw ErrorCode.FILE_TYPE_NOT_ALLOWED.throwIt("The PDF has no pages");
    }
    if (pages.size() > properties.maxPages()) {
      throw ErrorCode.FILE_TOO_LARGE.throwIt("The PDF exceeds the maximum page count");
    }
    update(attempt, job -> job.setTotalPages(pages.size()), true);
    for (var page : pages) {
      phase(attempt, AssessmentImportPhase.PARSING_QUESTIONS);
      var parsed = visionQuestionParser.parse(page);
      phase(attempt, AssessmentImportPhase.CROPPING_ASSETS);
      var uploads = new ArrayList<UploadedFile>();
      var registered = new AtomicBoolean();
      try {
        var pageFile =
            upload(
                page.image(),
                "page-%03d.png".formatted(page.pageNumber()),
                StorageFolder.ASSESSMENT_PAGE,
                uploads);
        var prepared = new ArrayList<PreparedQuestion>();
        for (var question : parsed.questions()) {
          var assetFiles = new ArrayList<UploadedFile>();
          for (int index = 0; index < question.assetRegions().size(); index++) {
            phase(attempt, AssessmentImportPhase.CROPPING_ASSETS);
            assetFiles.add(
                upload(
                    crop(page.image(), question.assetRegions().get(index).bbox()),
                    "page-%03d-question-%03d-asset-%02d.png"
                        .formatted(page.pageNumber(), prepared.size() + 1, index + 1),
                    StorageFolder.QUESTION,
                    uploads));
          }
          prepared.add(new PreparedQuestion(question, assetFiles));
        }
        transactions()
            .executeWithoutResult(
                ignored -> {
                  compensation.onRollback(uploads.stream().map(UploadedFile::storageKey).toList());
                  registered.set(true);
                  var job = requireAttempt(attempt);
                  var persistedPage =
                      fileRepository.save(
                          fileMapper.toEntity(pageFile, StorageFolder.ASSESSMENT_PAGE));
                  pageRepository.save(
                      AssessmentImportPage.builder()
                          .assessmentImport(job)
                          .pageNumber(page.pageNumber())
                          .file(persistedPage)
                          .width(page.width())
                          .height(page.height())
                          .build());
                  int ordinal = job.getDraftCount();
                  int warnings = job.getWarningCount();
                  for (var item : prepared) {
                    var question = item.question();
                    var draft =
                        draftRepository.save(
                            AssessmentQuestionDraft.builder()
                                .assessmentImport(job)
                                .ordinal(++ordinal)
                                .contentJson(question.content())
                                .answerJson(question.answer())
                                .parserPayloadJson(objectMapper.valueToTree(question))
                                .confidence(BigDecimal.valueOf(question.confidence()))
                                .warningsJson(objectMapper.valueToTree(question.warnings()))
                                .sourcePage(page.pageNumber())
                                .sourceBbox(objectMapper.valueToTree(question.questionBbox()))
                                .build());
                    warnings += question.warnings().size();
                    for (int index = 0; index < item.assets().size(); index++) {
                      var region = question.assetRegions().get(index);
                      var file =
                          fileRepository.save(
                              fileMapper.toEntity(
                                  item.assets().get(index), StorageFolder.QUESTION));
                      assetRepository.save(
                          AssessmentQuestionDraftAsset.builder()
                              .draft(draft)
                              .file(file)
                              .role(region.role())
                              .sortOrder(index)
                              .altText(region.altText())
                              .cropJson(objectMapper.valueToTree(region.bbox()))
                              .build());
                    }
                  }
                  job.setProcessedPages(job.getProcessedPages() + 1);
                  job.setProgress(Math.min(99, job.getProcessedPages() * 100 / pages.size()));
                  job.setDraftCount(ordinal);
                  job.setWarningCount(warnings);
                  job.setLeaseUntil(now().plus(LEASE));
                });
      } catch (RuntimeException failure) {
        // No transaction could start/register, or upload/preparation itself failed.
        // Once registered, only known rollback may delete bytes (unknown commit retains them).
        if (!registered.get()) {
          compensation.deleteBestEffort(uploads.stream().map(UploadedFile::storageKey).toList());
        }
        throw failure;
      }
    }
    update(
        attempt,
        job -> {
          job.setPhase(AssessmentImportPhase.REVIEW_REQUIRED);
          job.setStatus(AssessmentImportStatus.REVIEW_REQUIRED);
          job.setProgress(100);
          job.setLeaseUntil(null);
        },
        true);
    log.info(
        "Assessment import ready for review: importId={}, attempt={}",
        attempt.id(),
        attempt.number());
  }

  private UploadedFile upload(
      byte[] bytes, String name, StorageFolder folder, List<UploadedFile> uploaded) {
    var file = storageService.upload(bytes, name, "image/png", folder);
    uploaded.add(file);
    return file;
  }

  private void phase(Attempt attempt, AssessmentImportPhase phase) {
    update(attempt, job -> job.setPhase(phase), true);
  }

  private void update(
      Attempt attempt, Consumer<AssessmentImport> change, boolean requireOwnership) {
    transactions()
        .executeWithoutResult(
            ignored -> {
              var job = importRepository.findForUpdateById(attempt.id()).orElse(null);
              if (!owns(job, attempt)) {
                if (requireOwnership) {
                  throw new AttemptLostException();
                }
                return;
              }
              job.setLeaseUntil(now().plus(LEASE));
              change.accept(job);
            });
  }

  private AssessmentImport requireAttempt(Attempt attempt) {
    var job = importRepository.findForUpdateById(attempt.id()).orElse(null);
    if (!owns(job, attempt)) {
      throw new AttemptLostException();
    }
    return job;
  }

  private boolean owns(AssessmentImport job, Attempt attempt) {
    return job != null
        && job.getStatus() == AssessmentImportStatus.PROCESSING
        && job.getAttemptCount() == attempt.number()
        && job.getLeaseUntil() != null
        && job.getLeaseUntil().isAfter(now());
  }

  private TransactionTemplate transactions() {
    var template = new TransactionTemplate(transactionManager);
    template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    return template;
  }

  private OffsetDateTime now() {
    return OffsetDateTime.now(clock);
  }

  private record Attempt(UUID id, int number, String sourceKey) {}

  private record PreparedQuestion(ParsedQuestion question, List<UploadedFile> assets) {}

  private static final class AttemptLostException extends RuntimeException {}

  private byte[] crop(byte[] pageBytes, AssessmentBoundingBox rawBox) {
    try {
      var source = ImageIO.read(new ByteArrayInputStream(pageBytes));
      var box = rawBox == null ? new AssessmentBoundingBox(0, 0, 1, 1) : rawBox.clamped();
      int left = Math.max(0, (int) Math.floor(box.left() * source.getWidth()) - 12);
      int top = Math.max(0, (int) Math.floor(box.top() * source.getHeight()) - 12);
      int right =
          Math.min(source.getWidth(), (int) Math.ceil(box.right() * source.getWidth()) + 12);
      int bottom =
          Math.min(source.getHeight(), (int) Math.ceil(box.bottom() * source.getHeight()) + 12);
      var cropped =
          source.getSubimage(left, top, Math.max(1, right - left), Math.max(1, bottom - top));
      var output = new ByteArrayOutputStream();
      ImageIO.write(cropped, "png", output);
      return output.toByteArray();
    } catch (IOException | RuntimeException exception) {
      throw new IllegalStateException("Unable to crop assessment asset", exception);
    }
  }
}
