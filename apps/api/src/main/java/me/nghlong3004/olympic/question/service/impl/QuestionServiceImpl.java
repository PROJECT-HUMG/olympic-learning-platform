package me.nghlong3004.olympic.question.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.assessment.entity.AssessmentImport;
import me.nghlong3004.olympic.assessment.entity.AssessmentQuestionDraftAsset;
import me.nghlong3004.olympic.assessment.enums.AssessmentDraftStatus;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportPhase;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportStatus;
import me.nghlong3004.olympic.assessment.repository.AssessmentImportRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftAssetRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftRepository;
import me.nghlong3004.olympic.assessment.response.AssessmentImportStatusResponse;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.document.repository.SubjectRepository;
import me.nghlong3004.olympic.question.entity.Question;
import me.nghlong3004.olympic.question.entity.QuestionAsset;
import me.nghlong3004.olympic.question.enums.QuestionStatus;
import me.nghlong3004.olympic.question.repository.QuestionAssetRepository;
import me.nghlong3004.olympic.question.repository.QuestionRepository;
import me.nghlong3004.olympic.question.request.UpdateQuestionRequest;
import me.nghlong3004.olympic.question.response.QuestionPageResponse;
import me.nghlong3004.olympic.question.response.QuestionResponse;
import me.nghlong3004.olympic.question.service.QuestionService;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.topic.entity.Topic;
import me.nghlong3004.olympic.topic.repository.TopicRepository;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {
  private final QuestionRepository questionRepository;
  private final QuestionAssetRepository questionAssetRepository;
  private final AssessmentImportRepository importRepository;
  private final AssessmentQuestionDraftRepository draftRepository;
  private final AssessmentQuestionDraftAssetRepository draftAssetRepository;
  private final SubjectRepository subjectRepository;
  private final TopicRepository topicRepository;
  private final UserRepository userRepository;
  private final CurrentUserProvider currentUserProvider;
  private final StorageService storageService;
  private final Clock clock;

  @Transactional(readOnly = true)
  @Override
  public QuestionPageResponse search(
      QuestionStatus status, UUID subjectId, UUID topicId, String search, Pageable pageable) {
    var user = requireStaff();
    var effectivePageable = pageable == null ? PageRequest.of(0, 20) : pageable;
    var ownerId = user.role() == Role.ADMIN ? null : user.id();
    var page =
        questionRepository
            .search(ownerId, status, subjectId, topicId, blankToNull(search), effectivePageable)
            .map(this::toResponse);
    return QuestionPageResponse.from(page);
  }

  @Transactional(readOnly = true)
  @Override
  public QuestionResponse get(UUID id) {
    return toResponse(requireOwnedQuestion(id));
  }

  @Transactional
  @Override
  public QuestionResponse update(UUID id, UpdateQuestionRequest request) {
    var question = requireOwnedQuestion(id);
    if (question.getStatus() != QuestionStatus.DRAFT)
      throw ErrorCode.INVALID_RESOURCE_NAME.throwIt("Only draft questions can be edited");
    apply(question, request);
    var saved = questionRepository.save(question);
    log.info("Question updated: questionId={}", saved.getId());
    return toResponse(saved);
  }

  @Transactional
  @Override
  public QuestionResponse duplicate(UUID id) {
    var source = requireOwnedQuestion(id);
    var currentUser = requireStaff();
    var copy =
        Question.builder()
            .subject(source.getSubject())
            .topic(source.getTopic())
            .createdBy(userRepository.getReferenceById(currentUser.id()))
            .type(source.getType())
            .contentJson(source.getContentJson())
            .answerJson(source.getAnswerJson())
            .explanationJson(source.getExplanationJson())
            .difficulty(source.getDifficulty())
            .status(QuestionStatus.DRAFT)
            .build();
    var saved = questionRepository.save(copy);
    questionAssetRepository.saveAll(
        questionAssetRepository.findByQuestionIdOrderBySortOrderAsc(source.getId()).stream()
            .map(
                asset ->
                    QuestionAsset.builder()
                        .question(saved)
                        .file(asset.getFile())
                        .role(asset.getRole())
                        .sortOrder(asset.getSortOrder())
                        .altText(asset.getAltText())
                        .cropJson(asset.getCropJson())
                        .build())
            .toList());
    log.info("Question duplicated: sourceQuestionId={}, questionId={}", source.getId(), saved.getId());
    return toResponse(saved);
  }

  @Transactional
  @Override
  public QuestionResponse publish(UUID id) {
    var question = requireOwnedQuestion(id);
    if (question.getStatus() != QuestionStatus.DRAFT)
      throw ErrorCode.INVALID_RESOURCE_NAME.throwIt("Only draft questions can be published");
    validate(question);
    question.setStatus(QuestionStatus.PUBLISHED);
    question.setPublishedAt(OffsetDateTime.now(clock));
    var saved = questionRepository.save(question);
    log.info("Question published: questionId={}", saved.getId());
    return toResponse(saved);
  }

  @Transactional
  @Override
  public QuestionResponse archive(UUID id) {
    var question = requireOwnedQuestion(id);
    if (question.getStatus() != QuestionStatus.PUBLISHED)
      throw ErrorCode.INVALID_RESOURCE_NAME.throwIt("Only published questions can be archived");
    question.setStatus(QuestionStatus.ARCHIVED);
    question.setArchivedAt(OffsetDateTime.now(clock));
    var saved = questionRepository.save(question);
    log.info("Question archived: questionId={}", saved.getId());
    return toResponse(saved);
  }

  @Transactional
  @Override
  public QuestionResponse restore(UUID id) {
    var question = requireOwnedQuestion(id);
    if (question.getStatus() != QuestionStatus.ARCHIVED)
      throw ErrorCode.INVALID_RESOURCE_NAME.throwIt("Only archived questions can be restored");
    question.setStatus(QuestionStatus.PUBLISHED);
    question.setArchivedAt(null);
    var saved = questionRepository.save(question);
    log.info("Question restored: questionId={}", saved.getId());
    return toResponse(saved);
  }

  @Transactional
  @Override
  public AssessmentImportStatusResponse publishImport(UUID importId) {
    var current = requireStaff();
    var assessmentImport =
        (current.role() == Role.ADMIN
                ? importRepository.findById(importId)
                : importRepository.findByIdAndCreatedById(importId, current.id()))
            .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    if (assessmentImport.getStatus() == AssessmentImportStatus.PUBLISHED)
      return status(assessmentImport);
    var drafts = draftRepository.findByAssessmentImportIdOrderByOrdinalAsc(importId);
    if (drafts.isEmpty()
        || drafts.stream().anyMatch(draft -> draft.getStatus() != AssessmentDraftStatus.APPROVED))
      throw ErrorCode.INVALID_RESOURCE_NAME.throwIt(
          "All question drafts must be approved before publishing");
    var creator = userRepository.getReferenceById(assessmentImport.getCreatedBy().getId());
    for (var draft : drafts) {
      var subjectId = textUuid(draft.getContentJson(), "subjectId");
      var topicId = textUuid(draft.getContentJson(), "topicId");
      var subject =
          subjectRepository
              .findByIdAndEnabledTrue(subjectId)
              .orElseThrow(() -> ErrorCode.RESOURCE_NOT_FOUND.throwIt("Subject is required"));
      var topic =
          topicRepository
              .findById(topicId)
              .filter(
                  value -> value.isEnabled() && value.getSubject().getId().equals(subject.getId()))
              .orElseThrow(() -> ErrorCode.RESOURCE_NOT_FOUND.throwIt("Topic is required"));
      var question =
          Question.builder()
              .subject(subject)
              .topic(topic)
              .createdBy(creator)
              .sourceDraft(draft)
              .status(QuestionStatus.PUBLISHED)
              .type(draft.getContentJson().path("type").asText("multiple_choice"))
              .contentJson(draft.getContentJson())
              .answerJson(draft.getAnswerJson())
              .publishedAt(OffsetDateTime.now(clock))
              .build();
      var saved = questionRepository.save(question);
      questionAssetRepository.saveAll(
          draftAssetRepository.findByDraftIdOrderBySortOrderAsc(draft.getId()).stream()
              .map(asset -> copyAsset(saved, asset))
              .toList());
    }
    assessmentImport.setStatus(AssessmentImportStatus.PUBLISHED);
    assessmentImport.setPhase(AssessmentImportPhase.PUBLISHED);
    assessmentImport.setProgress(100);
    var savedImport = importRepository.save(assessmentImport);
    log.info("Assessment import published: importId={}, questionCount={}", importId, drafts.size());
    return status(savedImport);
  }

  private QuestionAsset copyAsset(Question question, AssessmentQuestionDraftAsset asset) {
    return QuestionAsset.builder()
        .question(question)
        .file(asset.getFile())
        .role(asset.getRole())
        .sortOrder(asset.getSortOrder())
        .altText(asset.getAltText())
        .cropJson(asset.getCropJson())
        .build();
  }

  private void apply(Question q, UpdateQuestionRequest r) {
    q.setSubject(
        subjectRepository
            .findByIdAndEnabledTrue(r.subjectId())
            .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt));
    q.setTopic(
        topicRepository
            .findById(r.topicId())
            .filter(Topic::isEnabled)
            .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt));
    if (!q.getTopic().getSubject().getId().equals(q.getSubject().getId()))
      throw ErrorCode.INVALID_RESOURCE_NAME.throwIt("Topic does not belong to subject");
    q.setType(r.type().trim());
    q.setContentJson(r.content());
    q.setAnswerJson(r.answer());
    q.setExplanationJson(
        r.explanation() == null
            ? JsonNodeFactory.instance.objectNode()
            : r.explanation());
    q.setDifficulty(r.difficulty());
  }

  private void validate(Question q) {
    if (q.getContentJson() == null
        || q.getContentJson().isEmpty()
        || q.getAnswerJson() == null
        || q.getAnswerJson().isEmpty()
        || q.getSubject() == null
        || q.getTopic() == null) throw ErrorCode.VALIDATION_ERROR.throwIt("Question is incomplete");
  }

  private Question requireOwnedQuestion(UUID id) {
    var user = requireStaff();
    var result =
        user.role() == Role.ADMIN
            ? questionRepository.findById(id)
            : questionRepository.findByIdAndCreatedById(id, user.id());
    return result.orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
  }

  private CurrentUser requireStaff() {
    var user = currentUserProvider.getCurrentUser();
    if (user.role() != Role.ADMIN && user.role() != Role.LECTURER)
      throw ErrorCode.ACCESS_DENIED.throwIt();
    return user;
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private UUID textUuid(JsonNode node, String field) {
    try {
      return UUID.fromString(node.path(field).asText());
    } catch (Exception e) {
      throw ErrorCode.VALIDATION_ERROR.throwIt(field + " is required");
    }
  }

  private AssessmentImportStatusResponse status(AssessmentImport value) {
    return new AssessmentImportStatusResponse(
        value.getId(),
        value.getStatus(),
        value.getPhase(),
        value.getProgress(),
        value.getTotalPages(),
        value.getProcessedPages(),
        value.getDraftCount(),
        value.getWarningCount(),
        value.getLastError(),
        value.getCreatedAt(),
        value.getUpdatedAt());
  }

  private QuestionResponse toResponse(Question q) {
    var assets =
        questionAssetRepository.findByQuestionIdOrderBySortOrderAsc(q.getId()).stream()
            .map(
                a ->
                    new QuestionResponse.QuestionAssetResponse(
                        a.getId(),
                        a.getRole().name(),
                        storageService.getDownloadUri(a.getFile().getStorageKey()).toString(),
                        a.getAltText(),
                        a.getCropJson()))
            .toList();
    return new QuestionResponse(
        q.getId(),
        q.getSubject().getId(),
        q.getSubject().getName(),
        q.getTopic().getId(),
        q.getTopic().getName(),
        q.getStatus(),
        q.getType(),
        q.getContentJson(),
        q.getAnswerJson(),
        q.getExplanationJson(),
        q.getDifficulty(),
        q.getPublishedAt(),
        q.getArchivedAt(),
        assets);
  }
}
