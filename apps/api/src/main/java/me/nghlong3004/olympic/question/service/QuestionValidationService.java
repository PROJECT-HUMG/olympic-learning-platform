package me.nghlong3004.olympic.question.service;

import me.nghlong3004.olympic.question.entity.Question;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public interface QuestionValidationService {

  /**
   * Requires a question to satisfy the minimum structure accepted by the question bank.
   *
   * @param question question to validate
   */
  void requireValid(Question question);
}
