package me.nghlong3004.olympic.document.service;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.document.request.CreateSubjectRequest;
import me.nghlong3004.olympic.document.request.UpdateSubjectRequest;
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

  /**
   * Creates a new subject.
   *
   * @param request creation payload
   * @return created subject summary
   */
  SubjectSummaryResponse createSubject(CreateSubjectRequest request);

  /**
   * Updates an existing subject.
   *
   * @param id subject ID
   * @param request update payload
   * @return updated subject summary
   */
  SubjectSummaryResponse updateSubject(UUID id, UpdateSubjectRequest request);

  /**
   * Soft deletes a subject by setting its status to disabled.
   *
   * @param id subject ID
   */
  void deleteSubject(UUID id);
}
