package me.nghlong3004.olympic.exam.service;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.exam.dto.ExamFigureDownload;
import me.nghlong3004.olympic.exam.request.PublishExamRequest;
import me.nghlong3004.olympic.exam.request.SaveExamDraftRequest;
import me.nghlong3004.olympic.exam.response.ExamDraftResponse;
import me.nghlong3004.olympic.exam.response.ExamPaperSummaryResponse;
import me.nghlong3004.olympic.exam.response.ExamPaperView;
import me.nghlong3004.olympic.exam.response.StaffExamSolutionResponse;

/**
 * Prepared exams. Every method loads the current active user. Draft mutation locks the owner row.
 * Release uses the server clock. Student results never carry answer or explanation fields.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public interface ExamService {
  /**
   * Lists drafts owned by the current lecturer, or every draft for an admin.
   * Students are denied.
   *
   * @return draft array, not a page
   */
  List<ExamDraftResponse> listDrafts();

  /**
   * Creates an owned draft. expectedVersion is ignored. Title and instructions may be null.
   * releaseAt may be null. Items may be empty. Placements are validated but not publishable-complete.
   *
   * @param request draft payload
   * @return created draft, including author and version
   */
  ExamDraftResponse create(SaveExamDraftRequest request);

  /**
   * Gets one draft for its owner or an admin.
   *
   * @param examId draft identifier
   * @return draft without bank answers
   */
  ExamDraftResponse getDraft(UUID examId);

  /**
   * Replaces an owned draft. expectedVersion is required and must match the locked row.
   *
   * @param examId draft identifier
   * @param request replacement payload, including expectedVersion
   * @return updated draft
   */
  ExamDraftResponse update(UUID examId, SaveExamDraftRequest request);

  /**
   * Publishes the next immutable version under the parent lock. expectedVersion is required.
   * The snapshot revalidates published schemaVersion 1 sources and copies private figure bytes.
   *
   * @param examId draft identifier
   * @param request expected draft version
   * @return frozen staff paper, including solutions
   */
  StaffExamSolutionResponse publish(UUID examId, PublishExamRequest request);

  /**
   * Previews the current draft as a paper for its owner or an admin. This does not persist a paper.
   * id, versionNumber, and publishedAt are null. releaseAt stays null while unset.
   * solutions selects the staff solution record; otherwise the staff plain record is returned.
   *
   * @param examId draft identifier
   * @param solutions whether to include answers and explanations
   * @return paper-shaped staff view
   */
  ExamPaperView preview(UUID examId, boolean solutions);

  /**
   * Lists published paper summaries. Staff see every version, including a future release.
   * Students see versions whose releaseAt is at or before the server clock. There is no expiry.
   *
   * @return summary array, without items or solutions
   */
  List<ExamPaperSummaryResponse> listPapers();

  /**
   * Gets one published paper. Students receive the student record even when solutions is true,
   * and only after release. Staff receive the solution record or the plain record.
   *
   * @param paperId paper identifier
   * @param solutions whether a staff caller requested answers
   * @return student or staff projection
   */
  ExamPaperView getPaper(UUID paperId, boolean solutions);

  /**
   * Returns one frozen private figure. Students may read only figures referenced by visible content,
   * and only from a released paper. Solution-only bytes are not found for a student.
   *
   * @param paperId paper identifier
   * @param assetId figure id stored in the frozen content
   * @return private bytes
   */
  ExamFigureDownload downloadFigure(UUID paperId, UUID assetId);
}
