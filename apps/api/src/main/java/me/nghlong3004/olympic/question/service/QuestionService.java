package me.nghlong3004.olympic.question.service;

import java.util.UUID;
import me.nghlong3004.olympic.assessment.response.AssessmentImportStatusResponse;
import me.nghlong3004.olympic.question.request.UpdateQuestionRequest;
import me.nghlong3004.olympic.question.response.QuestionPageResponse;
import me.nghlong3004.olympic.question.response.QuestionResponse;
import me.nghlong3004.olympic.question.enums.QuestionStatus;
import org.springframework.data.domain.Pageable;

/** @author nghlong3004 (Long Nguyen Hoang) @since 8/10/2026 */
public interface QuestionService {
  QuestionPageResponse search(QuestionStatus status, UUID subjectId, UUID topicId, String search, Pageable pageable);
  QuestionResponse get(UUID id);
  QuestionResponse update(UUID id, UpdateQuestionRequest request);
  QuestionResponse duplicate(UUID id);
  QuestionResponse publish(UUID id);
  QuestionResponse archive(UUID id);
  QuestionResponse restore(UUID id);
  AssessmentImportStatusResponse publishImport(UUID importId);
}
