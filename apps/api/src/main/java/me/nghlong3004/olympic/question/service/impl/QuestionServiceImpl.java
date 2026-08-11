package me.nghlong3004.olympic.question.service.impl;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.document.repository.SubjectRepository;
import me.nghlong3004.olympic.question.entity.Question;
import me.nghlong3004.olympic.question.entity.QuestionAsset;
import me.nghlong3004.olympic.question.enums.QuestionStatus;
import me.nghlong3004.olympic.question.mapper.QuestionMapper;
import me.nghlong3004.olympic.question.repository.QuestionAssetRepository;
import me.nghlong3004.olympic.question.repository.QuestionRepository;
import me.nghlong3004.olympic.question.request.UpdateQuestionRequest;
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
  private final SubjectRepository subjectRepository;
  private final TopicRepository topicRepository;
  private final UserRepository userRepository;
  private final CurrentUserProvider currentUserProvider;
  private final StorageService storageService;
  private final QuestionValidationService validationService;
  private final QuestionMapper questionMapper;
  private final Clock clock;

  @Transactional(readOnly = true)
  @Override
  public QuestionPageResponse search(
      QuestionStatus status, UUID subjectId, UUID topicId, String search, Pageable pageable) {
    var user = requireStaff();
    var effectivePageable = pageable == null ? PageRequest.of(0, 20) : pageable;
    var ownerId = user.role() == Role.ADMIN ? null : user.id();
    var questions =
        questionRepository.search(
            ownerId, status, subjectId, topicId, blankToNull(search), effectivePageable);
    var assetsByQuestionId = loadAssets(questions.getContent());
    var page =
        questions.map(
            question ->
                toResponse(
                    question,
                    assetsByQuestionId.getOrDefault(question.getId(), List.of())));
    return QuestionPageResponse.from(page);
  }

  @Transactional(readOnly = true)
  @Override
  public QuestionResponse get(UUID id) {
    var question = requireOwnedQuestion(id);
    return toResponse(
        question,
        questionAssetRepository.findByQuestionIdOrderBySortOrderAsc(question.getId()));
  }

  @Transactional
  @Override
  public QuestionResponse update(UUID id, UpdateQuestionRequest request) {
    var question = requireOwnedQuestion(id);
    if (question.getStatus() != QuestionStatus.DRAFT) {
      throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt("Only draft questions can be edited");
    }
    apply(question, request);
    validationService.requireValid(question);
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
    var copiedAssets =
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
            .toList();
    var savedAssets = questionAssetRepository.saveAll(copiedAssets);
    log.info("Question duplicated: sourceQuestionId={}, questionId={}", source.getId(), saved.getId());
    return toResponse(saved, savedAssets);
  }

  @Transactional
  @Override
  public QuestionResponse publish(UUID id) {
    var question = requireOwnedQuestion(id);
    if (question.getStatus() != QuestionStatus.DRAFT) {
      throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt("Only draft questions can be published");
    }
    validationService.requireValid(question);
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
    if (question.getStatus() != QuestionStatus.PUBLISHED) {
      throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt(
          "Only published questions can be archived");
    }
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
    if (question.getStatus() != QuestionStatus.ARCHIVED) {
      throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt("Only archived questions can be restored");
    }
    question.setStatus(QuestionStatus.PUBLISHED);
    question.setArchivedAt(null);
    var saved = questionRepository.save(question);
    log.info("Question restored: questionId={}", saved.getId());
    return toResponse(saved);
  }

  private void apply(Question question, UpdateQuestionRequest request) {
    question.setSubject(
        subjectRepository
            .findByIdAndEnabledTrue(request.subjectId())
            .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt));
    question.setTopic(
        topicRepository
            .findById(request.topicId())
            .filter(Topic::isEnabled)
            .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt));
    if (!question
        .getTopic()
        .getSubject()
        .getId()
        .equals(question.getSubject().getId())) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("Topic does not belong to subject");
    }
    question.setType(request.type().trim());
    question.setContentJson(request.content());
    question.setAnswerJson(request.answer());
    question.setExplanationJson(
        request.explanation() == null
            ? JsonNodeFactory.instance.objectNode()
            : request.explanation());
    question.setDifficulty(
        request.difficulty() == null || request.difficulty().isBlank()
            ? null
            : request.difficulty().trim());
  }

  private Question requireOwnedQuestion(UUID id) {
    var user = requireStaff();
    var result =
        user.role() == Role.ADMIN
            ? questionRepository.findDetailedById(id)
            : questionRepository.findByIdAndCreatedById(id, user.id());
    return result.orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
  }

  private CurrentUser requireStaff() {
    var user = currentUserProvider.getCurrentUser();
    if (user.role() != Role.ADMIN && user.role() != Role.LECTURER) {
      throw ErrorCode.ACCESS_DENIED.throwIt();
    }
    return user;
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private Map<UUID, List<QuestionAsset>> loadAssets(List<Question> questions) {
    if (questions.isEmpty()) {
      return Map.of();
    }
    var questionIds = questions.stream().map(Question::getId).toList();
    return questionAssetRepository
        .findByQuestionIdInOrderByQuestionIdAscSortOrderAsc(questionIds)
        .stream()
        .collect(Collectors.groupingBy(asset -> asset.getQuestion().getId()));
  }

  private QuestionResponse toResponse(Question question) {
    return toResponse(
        question,
        questionAssetRepository.findByQuestionIdOrderBySortOrderAsc(question.getId()));
  }

  private QuestionResponse toResponse(Question question, List<QuestionAsset> questionAssets) {
    var assets =
        questionAssets.stream()
            .map(
                asset ->
                    questionMapper.toAssetResponse(
                        asset, downloadUrl(asset.getFile().getStorageKey())))
            .toList();
    return questionMapper.toResponse(question, assets);
  }

  private String downloadUrl(String storageKey) {
    return storageService.getDownloadUri(storageKey).toString();
  }
}
