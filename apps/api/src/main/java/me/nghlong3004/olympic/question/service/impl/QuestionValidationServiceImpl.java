package me.nghlong3004.olympic.question.service.impl;

import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.question.entity.Question;
import me.nghlong3004.olympic.question.service.QuestionValidationService;
import org.springframework.stereotype.Service;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Slf4j
@Service
public class QuestionValidationServiceImpl implements QuestionValidationService {

  @Override
  public void requireValid(Question question) {
    if (question.getSubject() == null || question.getTopic() == null) {
      reject(question, "Subject and topic are required");
    }
    if (!question.getSubject().isEnabled() || !question.getTopic().isEnabled()) {
      reject(question, "Subject and topic must be enabled");
    }
    if (!question.getTopic().getSubject().getId().equals(question.getSubject().getId())) {
      reject(question, "Topic does not belong to subject");
    }
    if (question.getType() == null || question.getType().isBlank()) {
      reject(question, "Question type is required");
    }
    if (question.getType().length() > 80) {
      reject(question, "Question type must not exceed 80 characters");
    }
    if (question.getDifficulty() != null && question.getDifficulty().length() > 30) {
      reject(question, "Difficulty must not exceed 30 characters");
    }
    if (question.getContentJson() == null
        || !question.getContentJson().isObject()
        || question.getContentJson().isEmpty()
        || question.getContentJson().path("text").asText().isBlank()) {
      reject(question, "Question content text is required");
    }
    if (question.getAnswerJson() == null
        || !question.getAnswerJson().isObject()
        || question.getAnswerJson().isEmpty()) {
      reject(question, "Question answer is required");
    }
  }

  private void reject(Question question, String detail) {
    log.warn("Question validation failed: questionId={}, reason={}", question.getId(), detail);
    throw ErrorCode.VALIDATION_ERROR.throwIt(detail);
  }
}
