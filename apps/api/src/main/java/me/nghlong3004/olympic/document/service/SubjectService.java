package me.nghlong3004.olympic.document.service;

import java.util.List;
import me.nghlong3004.olympic.document.response.SubjectSummaryResponse;

/**
 * Provides business operations for managing subjects.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
public interface SubjectService {

  /**
   * Retrieves all enabled subjects, ordered alphabetically by name.
   *
   * @return list of enabled subject summaries
   */
  List<SubjectSummaryResponse> getAllEnabledSubjects();
}
