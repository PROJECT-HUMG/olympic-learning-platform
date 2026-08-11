package me.nghlong3004.olympic.question.service;

import java.util.List;
import me.nghlong3004.olympic.question.dto.ImportedQuestion;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public interface QuestionImportService {

  /**
   * Validates and persists imported questions and their assets in the caller's transaction.
   *
   * @param questions immutable imported question commands
   * @return number of persisted questions
   */
  int publishAll(List<ImportedQuestion> questions);
}
