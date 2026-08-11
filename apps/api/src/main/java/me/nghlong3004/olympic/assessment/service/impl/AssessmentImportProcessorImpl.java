package me.nghlong3004.olympic.assessment.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.UUID;
import javax.imageio.ImageIO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.assessment.dto.AssessmentBoundingBox;
import me.nghlong3004.olympic.assessment.dto.AssessmentPage;
import me.nghlong3004.olympic.assessment.dto.ParsedQuestion;
import me.nghlong3004.olympic.assessment.entity.AssessmentImport;
import me.nghlong3004.olympic.assessment.entity.AssessmentImportPage;
import me.nghlong3004.olympic.assessment.entity.AssessmentQuestionDraft;
import me.nghlong3004.olympic.assessment.entity.AssessmentQuestionDraftAsset;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportPhase;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportStatus;
import me.nghlong3004.olympic.assessment.repository.AssessmentImportPageRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentImportRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftAssetRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftRepository;
import me.nghlong3004.olympic.assessment.properties.AssessmentImportProperties;
import me.nghlong3004.olympic.assessment.service.AssessmentImportProcessor;
import me.nghlong3004.olympic.assessment.service.PdfDocumentReader;
import me.nghlong3004.olympic.assessment.service.VisionQuestionParser;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.storage.entity.File;
import me.nghlong3004.olympic.storage.enums.StorageFolder;
import me.nghlong3004.olympic.storage.mapper.FileMapper;
import me.nghlong3004.olympic.storage.repository.FileRepository;
import me.nghlong3004.olympic.storage.service.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Executes the deterministic PDF steps around the provider-neutral vision parser.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AssessmentImportProcessorImpl implements AssessmentImportProcessor {

  private final AssessmentImportRepository importRepository;
  private final AssessmentImportPageRepository pageRepository;
  private final AssessmentQuestionDraftRepository draftRepository;
  private final AssessmentQuestionDraftAssetRepository assetRepository;
  private final FileRepository fileRepository;
  private final FileMapper fileMapper;
  private final StorageService storageService;
  private final PdfDocumentReader pdfDocumentReader;
  private final VisionQuestionParser visionQuestionParser;
  private final ObjectMapper objectMapper;
  private final AssessmentImportProperties properties;

  @Override
  @Transactional
  public void process(UUID importId) {
    var assessmentImport = importRepository.findById(importId).orElse(null);
    if (assessmentImport == null || assessmentImport.getStatus() == AssessmentImportStatus.REVIEW_REQUIRED) {
      return;
    }
    try {
      processInternal(assessmentImport);
    } catch (Exception exception) {
      assessmentImport.setStatus(AssessmentImportStatus.FAILED);
      assessmentImport.setPhase(AssessmentImportPhase.FAILED);
      assessmentImport.setLastError(exception.getMessage() == null ? "Import failed" : exception.getMessage());
      importRepository.save(assessmentImport);
      log.error("Assessment import failed: importId={}", importId, exception);
    }
  }

  void processInternal(AssessmentImport assessmentImport) {
    assessmentImport.setStatus(AssessmentImportStatus.PROCESSING);
    assessmentImport.setPhase(AssessmentImportPhase.RENDERING_PAGES);
    assessmentImport.setAttemptCount(assessmentImport.getAttemptCount() + 1);
    importRepository.save(assessmentImport);

    var sourceBytes = storageService.download(assessmentImport.getSourceFile().getStorageKey());
    assessmentImport.setPhase(AssessmentImportPhase.EXTRACTING_TEXT);
    importRepository.save(assessmentImport);
    var pages = pdfDocumentReader.read(sourceBytes);
    if (pages.isEmpty()) throw ErrorCode.FILE_TYPE_NOT_ALLOWED.throwIt("The PDF has no pages");
    if (pages.size() > properties.maxPages()) {
      throw ErrorCode.FILE_TOO_LARGE.throwIt("The PDF exceeds the maximum page count");
    }
    assessmentImport.setTotalPages(pages.size());
    importRepository.save(assessmentImport);

    int ordinal = 0;
    int warningCount = 0;
    for (AssessmentPage page : pages) {
      var pageFile = saveGeneratedFile(page.image(), "page-%03d.png".formatted(page.pageNumber()), "image/png", StorageFolder.ASSESSMENT_PAGE);
      pageRepository.save(AssessmentImportPage.builder().assessmentImport(assessmentImport).pageNumber(page.pageNumber())
          .file(pageFile).width(page.width()).height(page.height()).build());

      assessmentImport.setPhase(AssessmentImportPhase.PARSING_QUESTIONS);
      var parsedPage = visionQuestionParser.parse(page);
      assessmentImport.setPhase(AssessmentImportPhase.CROPPING_ASSETS);
      for (ParsedQuestion parsedQuestion : parsedPage.questions()) {
        var draft = draftRepository.save(AssessmentQuestionDraft.builder()
            .assessmentImport(assessmentImport)
            .ordinal(++ordinal)
            .contentJson(parsedQuestion.content())
            .answerJson(parsedQuestion.answer())
            .parserPayloadJson(objectMapper.valueToTree(parsedQuestion))
            .confidence(BigDecimal.valueOf(parsedQuestion.confidence()))
            .warningsJson(objectMapper.valueToTree(parsedQuestion.warnings()))
            .sourcePage(page.pageNumber())
            .sourceBbox(objectMapper.valueToTree(parsedQuestion.questionBbox()))
            .build());
        warningCount += parsedQuestion.warnings().size();
        for (int assetIndex = 0; assetIndex < parsedQuestion.assetRegions().size(); assetIndex++) {
          var region = parsedQuestion.assetRegions().get(assetIndex);
          var crop = crop(page.image(), region.bbox());
          var assetFile = saveGeneratedFile(crop, "question-%03d-asset-%02d.png".formatted(ordinal, assetIndex + 1), "image/png", StorageFolder.QUESTION);
          assetRepository.save(AssessmentQuestionDraftAsset.builder().draft(draft).file(assetFile).role(region.role())
              .sortOrder(assetIndex).altText(region.altText()).cropJson(objectMapper.valueToTree(region.bbox())).build());
        }
      }
      assessmentImport.setProcessedPages(page.pageNumber());
      assessmentImport.setProgress(Math.min(99, page.pageNumber() * 100 / pages.size()));
      assessmentImport.setDraftCount(ordinal);
      assessmentImport.setWarningCount(warningCount);
      importRepository.save(assessmentImport);
    }
    assessmentImport.setPhase(AssessmentImportPhase.REVIEW_REQUIRED);
    assessmentImport.setStatus(AssessmentImportStatus.REVIEW_REQUIRED);
    assessmentImport.setProgress(100);
    importRepository.save(assessmentImport);
    log.info("Assessment import ready for review: importId={}, drafts={}", assessmentImport.getId(), ordinal);
  }

  private File saveGeneratedFile(byte[] content, String name, String contentType, StorageFolder folder) {
    var uploaded = storageService.upload(content, name, contentType, folder);
    return fileRepository.save(fileMapper.toEntity(uploaded, folder));
  }

  private byte[] crop(byte[] pageBytes, AssessmentBoundingBox rawBox) {
    try {
      var source = ImageIO.read(new java.io.ByteArrayInputStream(pageBytes));
      var box = rawBox == null ? new AssessmentBoundingBox(0, 0, 1, 1) : rawBox.clamped();
      int left = Math.max(0, (int) Math.floor(box.left() * source.getWidth()) - 12);
      int top = Math.max(0, (int) Math.floor(box.top() * source.getHeight()) - 12);
      int right = Math.min(source.getWidth(), (int) Math.ceil(box.right() * source.getWidth()) + 12);
      int bottom = Math.min(source.getHeight(), (int) Math.ceil(box.bottom() * source.getHeight()) + 12);
      var cropped = source.getSubimage(left, top, Math.max(1, right - left), Math.max(1, bottom - top));
      var output = new ByteArrayOutputStream();
      ImageIO.write(cropped, "png", output);
      return output.toByteArray();
    } catch (IOException | RuntimeException exception) {
      throw new IllegalStateException("Unable to crop assessment asset", exception);
    }
  }
}
