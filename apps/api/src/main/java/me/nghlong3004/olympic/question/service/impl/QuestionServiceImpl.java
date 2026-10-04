package me.nghlong3004.olympic.question.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.document.repository.SubjectRepository;
import me.nghlong3004.olympic.question.dto.QuestionFigureDownload;
import me.nghlong3004.olympic.question.entity.Question;
import me.nghlong3004.olympic.question.entity.QuestionAsset;
import me.nghlong3004.olympic.question.entity.QuestionFigure;
import me.nghlong3004.olympic.question.enums.QuestionStatus;
import me.nghlong3004.olympic.question.mapper.QuestionMapper;
import me.nghlong3004.olympic.question.repository.QuestionAssetRepository;
import me.nghlong3004.olympic.question.repository.QuestionFigureRepository;
import me.nghlong3004.olympic.question.repository.QuestionRepository;
import me.nghlong3004.olympic.question.request.UpdateQuestionRequest;
import me.nghlong3004.olympic.question.response.QuestionFigureResponse;
import me.nghlong3004.olympic.question.response.QuestionPageResponse;
import me.nghlong3004.olympic.question.response.QuestionResponse;
import me.nghlong3004.olympic.question.service.QuestionService;
import me.nghlong3004.olympic.question.service.QuestionValidationService;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.topic.entity.Topic;
import me.nghlong3004.olympic.topic.repository.TopicRepository;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
  private final QuestionFigureRepository questionFigureRepository;
  private final SubjectRepository subjectRepository;
  private final TopicRepository topicRepository;
  private final UserRepository userRepository;
  private final CurrentUserProvider currentUserProvider;
  private final StorageService storageService;
  private final QuestionValidationService validationService;
  private final QuestionManualContentValidator manualContentValidator;
  private final QuestionFigurePolicy questionFigurePolicy;
  private final QuestionMapper questionMapper;
  private final Clock clock;

  @Transactional(readOnly = true)
  @Override
  public QuestionPageResponse search(
      QuestionStatus status, UUID subjectId, UUID topicId, String search, Pageable pageable) {
    var user = requireStaff();
    var effectivePageable = pageable == null ? PageRequest.of(0, 20) : pageable;
    var ownerId = user.role() == Role.ADMIN ? null : user.id();
    var questions = questionRepository.search(
        ownerId, QuestionStatus.PUBLISHED, status, subjectId, topicId, blankToNull(search), effectivePageable);
    var assetsByQuestionId = loadAssets(questions.getContent());
    var page = questions.map(question -> toResponse(question, assetsByQuestionId.getOrDefault(question.getId(), List.of())));
    return QuestionPageResponse.from(page);
  }

  @Transactional(readOnly = true)
  @Override
  public QuestionResponse get(UUID id) {
    return toResponse(requireReadable(id));
  }

  @Transactional
  @Override
  public QuestionResponse create(UpdateQuestionRequest request) {
    var user = requireStaff();
    var content = manualContentValidator.normalizeNew(request.content());
    var type = request.type().trim();
    manualContentValidator.requireDraft(type, content, request.answer(), request.explanation(), Set.of());
    var question = Question.builder()
        .createdBy(userRepository.getReferenceById(user.id()))
        .status(QuestionStatus.DRAFT)
        .type(type)
        .contentJson(content)
        .answerJson(objectOrEmpty(request.answer()))
        .explanationJson(objectOrEmpty(request.explanation()))
        .difficulty(blankToNull(request.difficulty()))
        .build();
    applySubjectAndTopic(question, request);
    var saved = questionRepository.saveAndFlush(question);
    log.info("Manual question draft created: questionId={}", saved.getId());
    return toResponse(saved);
  }

  @Transactional
  @Override
  public QuestionResponse update(UUID id, UpdateQuestionRequest request) {
    var question = requireEditableDraft(id, "Only draft questions can be edited");
    boolean manual = applyContent(question, request);
    if (manual) {
      manualContentValidator.requireDraft(
          question.getType(), question.getContentJson(), question.getAnswerJson(),
          question.getExplanationJson(), figureIds(question.getId()));
    } else {
      validationService.requireValid(question);
    }
    var saved = questionRepository.saveAndFlush(question);
    log.info("Question updated: questionId={}", saved.getId());
    return toResponse(saved);
  }

  @Transactional
  @Override
  public QuestionResponse duplicate(UUID id) {
    var user = requireStaff();
    var source = requireVisibleLocked(user, id);
    var copy = Question.builder()
        .subject(source.getSubject())
        .topic(source.getTopic())
        .createdBy(userRepository.getReferenceById(user.id()))
        .type(source.getType())
        .contentJson(copyJson(source.getContentJson()))
        .answerJson(copyJson(source.getAnswerJson()))
        .explanationJson(copyJson(source.getExplanationJson()))
        .difficulty(source.getDifficulty())
        .status(QuestionStatus.DRAFT)
        .build();
    var persisted = questionRepository.save(copy);
    var figureIds = new HashMap<UUID, UUID>();
    for (var figure : questionFigureRepository.findByQuestionId(source.getId())) {
      var created = questionFigureRepository.save(QuestionFigure.builder()
          .questionId(persisted.getId())
          .originalName(figure.getOriginalName())
          .contentType(figure.getContentType())
          .size(figure.getSize())
          .content(figure.getContent().clone())
          .build());
      figureIds.put(figure.getId(), created.getId());
    }
    if (!figureIds.isEmpty()) {
      persisted.setContentJson(rewriteFigureIds(persisted.getContentJson(), figureIds));
      persisted.setAnswerJson(rewriteFigureIds(persisted.getAnswerJson(), figureIds));
      persisted.setExplanationJson(rewriteFigureIds(persisted.getExplanationJson(), figureIds));
    }
    final Question parent = questionRepository.saveAndFlush(persisted);
    var copiedAssets = questionAssetRepository.findByQuestionIdOrderBySortOrderAsc(source.getId()).stream()
        .map(asset -> QuestionAsset.builder()
            .question(parent)
            .file(asset.getFile())
            .role(asset.getRole())
            .sortOrder(asset.getSortOrder())
            .altText(asset.getAltText())
            .cropJson(asset.getCropJson())
            .build())
        .toList();
    var savedAssets = questionAssetRepository.saveAll(copiedAssets);
    log.info("Question duplicated: sourceQuestionId={}, questionId={}", source.getId(), parent.getId());
    return toResponse(parent, savedAssets);
  }

  @Transactional
  @Override
  public QuestionResponse publish(UUID id) {
    var question = requireEditableDraft(id, "Only draft questions can be published");
    requirePublishable(question);
    question.setStatus(QuestionStatus.PUBLISHED);
    question.setPublishedAt(OffsetDateTime.now(clock));
    var saved = questionRepository.saveAndFlush(question);
    log.info("Question published: questionId={}", saved.getId());
    return toResponse(saved);
  }

  private void requirePublishable(Question question) {
    requireEnabledPlacement(question);
    if (isSchemaVersionOne(question.getContentJson())) {
      requirePrivateManualAssets(question);
      manualContentValidator.requirePublishable(
          question.getType(), question.getContentJson(), question.getAnswerJson(),
          question.getExplanationJson(), figureIds(question.getId()));
    } else if (question.getContentJson().has("schemaVersion")) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("Unsupported question schema version");
    } else {
      validationService.requireValid(question);
    }
  }

  @Transactional
  @Override
  public QuestionResponse archive(UUID id) {
    var question = requireOwnedLocked(id);
    if (question.getStatus() != QuestionStatus.PUBLISHED) {
      throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt("Only published questions can be archived");
    }
    question.setStatus(QuestionStatus.ARCHIVED);
    question.setArchivedAt(OffsetDateTime.now(clock));
    var saved = questionRepository.saveAndFlush(question);
    log.info("Question archived: questionId={}", saved.getId());
    return toResponse(saved);
  }

  @Transactional
  @Override
  public QuestionResponse restore(UUID id) {
    var question = requireOwnedLocked(id);
    if (question.getStatus() != QuestionStatus.ARCHIVED) {
      throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt("Only archived questions can be restored");
    }
    requirePublishable(question);
    question.setStatus(QuestionStatus.PUBLISHED);
    question.setArchivedAt(null);
    var saved = questionRepository.saveAndFlush(question);
    log.info("Question restored: questionId={}", saved.getId());
    return toResponse(saved);
  }

  @Transactional
  @Override
  public QuestionFigureResponse uploadFigure(UUID id, MultipartFile file) {
    var question = requireEditableDraft(id, "Only draft questions can be edited");
    if (questionFigureRepository.countByQuestionId(question.getId()) >= QuestionFigurePolicy.MAX_FIGURES) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("A question can contain at most 20 figures");
    }
    var accepted = questionFigurePolicy.read(file);
    var saved = questionFigureRepository.saveAndFlush(QuestionFigure.builder()
        .questionId(question.getId())
        .originalName(accepted.originalName())
        .contentType(accepted.contentType())
        .size(accepted.content().length)
        .content(accepted.content())
        .build());
    log.info(
        "Question figure stored: questionId={}, figureId={}, size={}",
        question.getId(), saved.getId(), saved.getSize());
    return new QuestionFigureResponse(saved.getId(), saved.getContentType(), saved.getSize(), saved.getOriginalName());
  }

  @Transactional(readOnly = true)
  @Override
  public QuestionFigureDownload downloadFigure(UUID id, UUID figureId) {
    requireReadable(id);
    var figure = questionFigureRepository.findByIdAndQuestionId(figureId, id)
        .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    return new QuestionFigureDownload(figure.getOriginalName(), figure.getContentType(), figure.getContent().clone());
  }

  private boolean applyContent(Question question, UpdateQuestionRequest request) {
    if (request.content() != null && request.content().isObject() && request.content().has("schemaVersion")
        && !isSchemaVersionOne(request.content())) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("Unsupported question schema version");
    }
    boolean manual = isSchemaVersionOne(request.content());
    if (manual) {
      requirePrivateManualAssets(question);
    }
    if (isSchemaVersionOne(question.getContentJson()) && !manual) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("Manual question content must stay schemaVersion 1");
    }
    requireExpectedVersion(question, request.expectedVersion(), manual);
    applySubjectAndTopic(question, request);
    question.setType(request.type().trim());
    question.setContentJson(request.content());
    question.setAnswerJson(objectOrEmpty(request.answer()));
    question.setExplanationJson(objectOrEmpty(request.explanation()));
    question.setDifficulty(blankToNull(request.difficulty()));
    return manual;
  }

  private void applySubjectAndTopic(Question question, UpdateQuestionRequest request) {
    question.setSubject(subjectRepository.findByIdAndEnabledTrue(request.subjectId())
        .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt));
    question.setTopic(topicRepository.findById(request.topicId()).filter(Topic::isEnabled)
        .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt));
    if (!question.getTopic().getSubject().getId().equals(question.getSubject().getId())) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("Topic does not belong to subject");
    }
  }

  private void requirePrivateManualAssets(Question question) {
    if (!questionAssetRepository.findByQuestionIdOrderBySortOrderAsc(question.getId()).isEmpty()) {
      throw ErrorCode.VALIDATION_ERROR.throwIt(
          "Legacy assets cannot be converted to manual content; create a new manual draft with private figures");
    }
  }

  private void requireEnabledPlacement(Question question) {
    var subject = subjectRepository.findByIdAndEnabledTrue(question.getSubject().getId())
        .orElseThrow(() -> ErrorCode.VALIDATION_ERROR.throwIt("Subject and topic must be enabled"));
    var topic = topicRepository.findById(question.getTopic().getId()).filter(Topic::isEnabled)
        .orElseThrow(() -> ErrorCode.VALIDATION_ERROR.throwIt("Subject and topic must be enabled"));
    if (!topic.getSubject().getId().equals(subject.getId())) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("Topic does not belong to subject");
    }
  }

  private void requireExpectedVersion(Question question, Long expectedVersion, boolean manual) {
    if (manual && expectedVersion == null) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("expectedVersion is required");
    }
    if (expectedVersion != null && expectedVersion != question.getVersion()) {
      throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt("Question was updated by someone else");
    }
  }

  private Question requireEditableDraft(UUID id, String notDraftDetail) {
    var question = requireOwnedLocked(id);
    if (question.getStatus() != QuestionStatus.DRAFT) {
      throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt(notDraftDetail);
    }
    return question;
  }

  private Question requireOwnedLocked(UUID id) {
    var user = requireStaff();
    var question = questionRepository.findForUpdateById(id).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    if (user.role() != Role.ADMIN && !question.getCreatedBy().getId().equals(user.id())) {
      throw ErrorCode.RESOURCE_NOT_FOUND.throwIt();
    }
    return question;
  }

  private Question requireVisibleLocked(CurrentUser user, UUID id) {
    var question = questionRepository.findForUpdateById(id).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    if (user.role() != Role.ADMIN
        && question.getStatus() != QuestionStatus.PUBLISHED
        && !question.getCreatedBy().getId().equals(user.id())) {
      throw ErrorCode.RESOURCE_NOT_FOUND.throwIt();
    }
    return question;
  }

  private Question requireReadable(UUID id) {
    var user = requireStaff();
    var result = user.role() == Role.ADMIN
        ? questionRepository.findDetailedById(id)
        : questionRepository.findVisibleById(id, user.id(), QuestionStatus.PUBLISHED);
    return result.orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
  }

  private CurrentUser requireStaff() {
    var user = currentUserProvider.getCurrentUser();
    if (user.role() != Role.ADMIN && user.role() != Role.LECTURER) {
      throw ErrorCode.ACCESS_DENIED.throwIt();
    }
    return user;
  }

  private Set<UUID> figureIds(UUID questionId) {
    return questionFigureRepository.findByQuestionId(questionId).stream()
        .map(QuestionFigure::getId)
        .collect(Collectors.toCollection(HashSet::new));
  }

  private static boolean isSchemaVersionOne(JsonNode content) {
    if (content == null || !content.isObject() || !content.has("schemaVersion")) {
      return false;
    }
    JsonNode version = content.get("schemaVersion");
    return version.isNumber() && !version.isFloatingPointNumber()
        && version.canConvertToLong() && version.longValue() == 1L;
  }

  private static JsonNode objectOrEmpty(JsonNode node) {
    return node == null || node.isNull() ? JsonNodeFactory.instance.objectNode() : node;
  }

  private static JsonNode copyJson(JsonNode node) {
    return node == null ? JsonNodeFactory.instance.objectNode() : node.deepCopy();
  }

  private static JsonNode rewriteFigureIds(JsonNode node, Map<UUID, UUID> figureIds) {
    JsonNode copy = copyJson(node);
    rewrite(copy, figureIds);
    return copy;
  }

  private static void rewrite(JsonNode node, Map<UUID, UUID> figureIds) {
    if (node instanceof ObjectNode object) {
      JsonNode assetId = object.get("assetId");
      if (assetId != null && assetId.isTextual()) {
        try {
          UUID mapped = figureIds.get(UUID.fromString(assetId.asText()));
          if (mapped != null) {
            object.put("assetId", mapped.toString());
          }
        } catch (IllegalArgumentException ignored) {
          // Legacy text is not a figure id and stays unchanged.
        }
      }
      object.properties().forEach(entry -> rewrite(entry.getValue(), figureIds));
    } else if (node.isArray()) {
      node.forEach(child -> rewrite(child, figureIds));
    }
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private Map<UUID, List<QuestionAsset>> loadAssets(List<Question> questions) {
    if (questions.isEmpty()) {
      return Map.of();
    }
    var questionIds = questions.stream().map(Question::getId).toList();
    return questionAssetRepository.findByQuestionIdInOrderByQuestionIdAscSortOrderAsc(questionIds).stream()
        .collect(Collectors.groupingBy(asset -> asset.getQuestion().getId()));
  }

  private QuestionResponse toResponse(Question question) {
    return toResponse(question, questionAssetRepository.findByQuestionIdOrderBySortOrderAsc(question.getId()));
  }

  private QuestionResponse toResponse(Question question, List<QuestionAsset> questionAssets) {
    var assets = questionAssets.stream()
        .map(asset -> questionMapper.toAssetResponse(asset, downloadUrl(asset.getFile().getStorageKey())))
        .toList();
    return questionMapper.toResponse(question, assets);
  }

  private String downloadUrl(String storageKey) {
    return storageService.getDownloadUri(storageKey).toString();
  }
}
