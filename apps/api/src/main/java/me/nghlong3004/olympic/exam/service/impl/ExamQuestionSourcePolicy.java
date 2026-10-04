package me.nghlong3004.olympic.exam.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.document.repository.SubjectRepository;
import me.nghlong3004.olympic.question.entity.Question;
import me.nghlong3004.olympic.question.entity.QuestionFigure;
import me.nghlong3004.olympic.question.enums.QuestionStatus;
import me.nghlong3004.olympic.question.repository.QuestionFigureRepository;
import me.nghlong3004.olympic.question.service.impl.QuestionManualContentValidator;
import me.nghlong3004.olympic.topic.entity.Topic;
import me.nghlong3004.olympic.topic.repository.TopicRepository;
import org.springframework.stereotype.Component;

/**
 * Revalidates a published schemaVersion 1 question before an exam save, preview, or publish.
 * Imported publication is not trusted. Legacy asset URLs are neither read nor returned.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Component
@RequiredArgsConstructor
public class ExamQuestionSourcePolicy {
  public static final String NOT_MANUAL =
      "Question is not a published schemaVersion 1 item in this subject";
  public static final String PLACEMENT_DISABLED = "Subject and topic must be enabled";
  public static final String TOPIC_MISMATCH = "Topic does not belong to subject";

  private final SubjectRepository subjectRepository;
  private final TopicRepository topicRepository;
  private final QuestionFigureRepository questionFigureRepository;
  private final QuestionManualContentValidator manualContentValidator;

  public FrozenQuestion requireDraftPlacement(Question question, UUID examSubjectId) {
    var figures = requireManual(question, examSubjectId);
    manualContentValidator.requireDraft(
        question.getType(),
        question.getContentJson(),
        question.getAnswerJson(),
        question.getExplanationJson(),
        ids(figures));
    return freeze(question, figures);
  }

  public FrozenQuestion requirePublishablePlacement(Question question, UUID examSubjectId) {
    var figures = requireManual(question, examSubjectId);
    manualContentValidator.requirePublishable(
        question.getType(),
        question.getContentJson(),
        question.getAnswerJson(),
        question.getExplanationJson(),
        ids(figures));
    return freeze(question, figures);
  }

  private List<QuestionFigure> requireManual(Question question, UUID examSubjectId) {
    if (question == null
        || question.getStatus() != QuestionStatus.PUBLISHED
        || question.getSubject() == null
        || examSubjectId == null
        || !examSubjectId.equals(question.getSubject().getId())
        || !schemaVersionOne(question.getContentJson())) {
      throw ErrorCode.VALIDATION_ERROR.throwIt(NOT_MANUAL);
    }
    var subject = subjectRepository.findByIdAndEnabledTrue(question.getSubject().getId())
        .orElseThrow(() -> ErrorCode.VALIDATION_ERROR.throwIt(PLACEMENT_DISABLED));
    var topic = topicRepository.findById(question.getTopic().getId())
        .filter(Topic::isEnabled)
        .orElseThrow(() -> ErrorCode.VALIDATION_ERROR.throwIt(PLACEMENT_DISABLED));
    if (topic.getSubject() == null || !topic.getSubject().getId().equals(subject.getId())) {
      throw ErrorCode.VALIDATION_ERROR.throwIt(TOPIC_MISMATCH);
    }
    return questionFigureRepository.findByQuestionId(question.getId());
  }

  private static Set<UUID> ids(List<QuestionFigure> figures) {
    if (figures == null) {
      return Set.of();
    }
    return figures.stream()
        .map(QuestionFigure::getId)
        .collect(Collectors.toCollection(HashSet::new));
  }

  private static FrozenQuestion freeze(Question question, List<QuestionFigure> figures) {
    return new FrozenQuestion(
        question.getId(),
        copy(question.getContentJson()),
        copy(question.getAnswerJson()),
        copy(question.getExplanationJson()),
        figures == null ? List.of() : List.copyOf(figures));
  }

  private static boolean schemaVersionOne(JsonNode content) {
    if (content == null || !content.isObject() || !content.has("schemaVersion")) {
      return false;
    }
    var version = content.get("schemaVersion");
    return version.isNumber()
        && !version.isFloatingPointNumber()
        && version.canConvertToLong()
        && version.longValue() == 1L;
  }

  private static JsonNode copy(JsonNode node) {
    if (node == null || node.isNull()) {
      return JsonNodeFactory.instance.objectNode();
    }
    return node.deepCopy();
  }

  /**
   * Scientific snapshot plus the question's private figures. No legacy asset URL is included.
   */
  public record FrozenQuestion(
      UUID questionId,
      JsonNode content,
      JsonNode answer,
      JsonNode explanation,
      List<QuestionFigure> figures) {}
}
