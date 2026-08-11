package me.nghlong3004.olympic.question.service;

import java.util.UUID;
import me.nghlong3004.olympic.question.enums.QuestionStatus;
import me.nghlong3004.olympic.question.request.UpdateQuestionRequest;
import me.nghlong3004.olympic.question.response.QuestionPageResponse;
import me.nghlong3004.olympic.question.response.QuestionResponse;
import org.springframework.data.domain.Pageable;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public interface QuestionService {
  /**
   * Searches questions visible to the current staff user.
   *
   * @param status optional status filter
   * @param subjectId optional subject filter
   * @param topicId optional topic filter
   * @param search optional question type search text
   * @param pageable requested page and sort
   * @return page of matching questions
   */
  QuestionPageResponse search(
      QuestionStatus status, UUID subjectId, UUID topicId, String search, Pageable pageable);

  /**
   * Gets a question visible to the current staff user.
   *
   * @param id question identifier
   * @return question details
   */
  QuestionResponse get(UUID id);

  /**
   * Updates an owned draft question.
   *
   * @param id question identifier
   * @param request validated update payload
   * @return updated question
   */
  QuestionResponse update(UUID id, UpdateQuestionRequest request);

  /**
   * Creates an owned draft copy of a visible question and its assets.
   *
   * @param id source question identifier
   * @return duplicated draft question
   */
  QuestionResponse duplicate(UUID id);

  /**
   * Validates and publishes an owned draft question.
   *
   * @param id question identifier
   * @return published question
   */
  QuestionResponse publish(UUID id);

  /**
   * Archives an owned published question.
   *
   * @param id question identifier
   * @return archived question
   */
  QuestionResponse archive(UUID id);

  /**
   * Restores an owned archived question to published state.
   *
   * @param id question identifier
   * @return restored question
   */
  QuestionResponse restore(UUID id);

}
