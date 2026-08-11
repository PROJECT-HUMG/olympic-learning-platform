package me.nghlong3004.olympic.question.service.impl;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.document.repository.SubjectRepository;
import me.nghlong3004.olympic.question.dto.ImportedQuestion;
import me.nghlong3004.olympic.question.entity.Question;
import me.nghlong3004.olympic.question.entity.QuestionAsset;
import me.nghlong3004.olympic.question.enums.QuestionStatus;
import me.nghlong3004.olympic.question.repository.QuestionAssetRepository;
import me.nghlong3004.olympic.question.repository.QuestionRepository;
import me.nghlong3004.olympic.question.service.QuestionImportService;
import me.nghlong3004.olympic.question.service.QuestionValidationService;
import me.nghlong3004.olympic.storage.repository.FileRepository;
import me.nghlong3004.olympic.topic.repository.TopicRepository;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionImportServiceImpl implements QuestionImportService {
  private static final String DEFAULT_TYPE = "multiple_choice";

  private final QuestionRepository questionRepository;
  private final QuestionAssetRepository questionAssetRepository;
  private final SubjectRepository subjectRepository;
  private final TopicRepository topicRepository;
  private final UserRepository userRepository;
  private final FileRepository fileRepository;
  private final QuestionValidationService validationService;
  private final Clock clock;

  @Transactional
  @Override
  public int publishAll(List<ImportedQuestion> questions) {
    if (questions == null || questions.isEmpty()) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("At least one approved question is required");
    }
    for (var command : questions) {
      publish(command);
    }
    log.info("Imported questions published: questionCount={}", questions.size());
    return questions.size();
  }

  private void publish(ImportedQuestion command) {
    var subject =
        subjectRepository
            .findByIdAndEnabledTrue(command.subjectId())
            .orElseThrow(() -> ErrorCode.RESOURCE_NOT_FOUND.throwIt("Subject is required"));
    var topic =
        topicRepository
            .findById(command.topicId())
            .filter(value -> value.isEnabled() && value.getSubject().getId().equals(subject.getId()))
            .orElseThrow(() -> ErrorCode.RESOURCE_NOT_FOUND.throwIt("Topic is required"));
    var question =
        Question.builder()
            .subject(subject)
            .topic(topic)
            .createdBy(userRepository.getReferenceById(command.creatorId()))
            .sourceDraftId(command.sourceDraftId())
            .status(QuestionStatus.PUBLISHED)
            .type(normalizeType(command.type()))
            .contentJson(command.content())
            .answerJson(command.answer())
            .explanationJson(
                command.explanation() == null
                    ? JsonNodeFactory.instance.objectNode()
                    : command.explanation())
            .difficulty(normalizeOptional(command.difficulty()))
            .publishedAt(OffsetDateTime.now(clock))
            .build();
    validationService.requireValid(question);
    var saved = questionRepository.save(question);
    questionAssetRepository.saveAll(toAssets(saved, command.assets()));
  }

  private List<QuestionAsset> toAssets(
      Question question, List<ImportedQuestion.ImportedQuestionAsset> assets) {
    return assets.stream().map(asset -> toAsset(question, asset)).toList();
  }

  private QuestionAsset toAsset(
      Question question, ImportedQuestion.ImportedQuestionAsset asset) {
    validateAsset(asset);
    var file =
        fileRepository
            .findById(asset.fileId())
            .orElseThrow(ErrorCode.FILE_NOT_FOUND::throwIt);
    return QuestionAsset.builder()
        .question(question)
        .file(file)
        .role(asset.role())
        .sortOrder(asset.sortOrder())
        .altText(normalizeOptional(asset.altText()))
        .cropJson(
            asset.crop() == null ? JsonNodeFactory.instance.objectNode() : asset.crop())
        .build();
  }

  private void validateAsset(ImportedQuestion.ImportedQuestionAsset asset) {
    if (asset.fileId() == null || asset.role() == null || asset.sortOrder() < 0) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("Question asset is invalid");
    }
    if (asset.altText() != null && asset.altText().length() > 500) {
      throw ErrorCode.VALIDATION_ERROR.throwIt(
          "Question asset alt text must not exceed 500 characters");
    }
  }

  private String normalizeType(String type) {
    return type == null || type.isBlank() ? DEFAULT_TYPE : type.trim();
  }

  private String normalizeOptional(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }
}
