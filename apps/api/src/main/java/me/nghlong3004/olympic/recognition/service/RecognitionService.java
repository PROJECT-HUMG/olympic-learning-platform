package me.nghlong3004.olympic.recognition.service;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.recognition.dto.RecognitionDownload;
import me.nghlong3004.olympic.recognition.enums.AchievementStatus;
import me.nghlong3004.olympic.recognition.request.ReviewAchievementRequest;
import me.nghlong3004.olympic.recognition.request.SaveHonorRequest;
import me.nghlong3004.olympic.recognition.request.SubmitAchievementRequest;
import me.nghlong3004.olympic.recognition.response.AchievementResponse;
import me.nghlong3004.olympic.recognition.response.HonorResponse;
import me.nghlong3004.olympic.recognition.response.RankingResponse;
import me.nghlong3004.olympic.recognition.response.RecognitionPreferencesResponse;
import me.nghlong3004.olympic.recognition.response.RecognitionProfileResponse;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

/**
 * Recognition boundaries: only approved academic records score; honors never grant points.
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
public interface RecognitionService {
  /**
   * Browses published memories, or includes drafts after checking the live administrator.
   *
   * @param year optional honor year
   * @param subject optional subject text
   * @param page zero-based page
   * @param size bounded page size
   * @param admin whether draft access is requested
   * @return matching honors
   */
  Page<HonorResponse> listHonors(Integer year, String subject, int page, int size, boolean admin);
  /**
   * Reads a memory while preventing public access to draft details.
   *
   * @param id honor identifier
   * @param admin whether authorized draft access is requested
   * @return memory details
   */
  HonorResponse getHonor(UUID id, boolean admin);
  /**
   * Creates or updates a versioned memory as an active administrator; never grants points.
   *
   * @param id memory identifier, null for creation
   * @param request validated memory and ordered participant snapshots
   * @return saved honor
   */
  HonorResponse saveHonor(UUID id, SaveHonorRequest request);
  /**
   * Deletes an authorized memory and its gallery transactionally.
   *
   * @param id memory to delete
   */
  void deleteHonor(UUID id);
  /**
   * Appends bounded photos under the memory lock and advances its edit version.
   *
   * @param id memory identifier
   * @param files bounded image uploads
   * @return updated gallery and version
   */
  HonorResponse addPhotos(UUID id, List<MultipartFile> files);
  /**
   * Removes a photo only when it belongs to the authorized memory.
   *
   * @param id memory identifier
   * @param photoId its photo identifier
   * @return updated gallery and version
   */
  HonorResponse removePhoto(UUID id, UUID photoId);
  /**
   * Resolves image bytes after checking publication or live administrator access.
   *
   * @param id memory identifier
   * @param photoId its photo identifier
   * @param admin whether draft access is requested
   * @return authorized image bytes
   */
  RecognitionDownload getPhoto(UUID id, UUID photoId, boolean admin);
  /**
   * Reads the active student's records and their private review history.
   *
   * @return owned records including review and evidence metadata
   */
  List<AchievementResponse> listMyAchievements();
  /**
   * Submits an academic claim; live administrators may submit for another active student.
   * The mandatory proof remains private and pending records do not contribute points.
   *
   * @param request academic claim
   * @param evidence mandatory bounded private proof
   * @param admin whether submitting on behalf of another student
   * @return pending achievement
   */
  AchievementResponse submitAchievement(SubmitAchievementRequest request, List<MultipartFile> evidence, boolean admin);
  /**
   * Replaces an owned nonapproved claim and proof, invalidating any stale review version.
   *
   * @param id owned nonapproved record
   * @param request corrected academic claim
   * @param evidence replacement proof
   * @return record pending fresh review
   */
  AchievementResponse updateAchievement(UUID id, SubmitAchievementRequest request, List<MultipartFile> evidence);
  /**
   * Changes public details without removing an approved record from aggregate scores.
   *
   * @param id owned record
   * @param publicVisible whether approved details may be public
   * @return updated record
   */
  AchievementResponse setVisibility(UUID id, boolean publicVisible);
  /**
   * Authorizes the live owner or administrator before loading private binary proof.
   *
   * @param id achievement identifier
   * @param attachmentId its private evidence identifier
   * @return authorized bytes, never an external storage URL
   */
  RecognitionDownload getEvidence(UUID id, UUID attachmentId);
  /**
   * Reads the private review queue and decision history as a live administrator.
   *
   * @param status optional review filter
   * @param userId optional student filter
   * @param page zero-based page
   * @param size bounded page size
   * @return matching review records
   */
  Page<AchievementResponse> adminListAchievements(AchievementStatus status, UUID userId, int page, int size);
  /**
   * Reviews under a record lock and displayed version. Repeated current decisions are
   * idempotent; rejection and revocation remove the record from fresh score aggregates.
   *
   * @param id achievement identifier
   * @param request versioned approval, rejection or revocation
   * @return reviewed record
   */
  AchievementResponse reviewAchievement(UUID id, ReviewAchievementRequest request);
  /**
   * Ranks active opted-in students with approved achievements in the requested period.
   * Ties use competition ranks and private approved records contribute to the total.
   *
   * @param year achievement-date year, null for all time
   * @param page zero-based page
   * @param size bounded page size
   * @return stable competition ranks
   */
  Page<RankingResponse> rankings(Integer year, int page, int size);
  /**
   * Reads public approved academic details and their public-only point subtotal.
   *
   * @param userId active student identifier
   * @return public profile, never evidence, review notes or private points
   */
  RecognitionProfileResponse profile(UUID userId);
  /**
   * Reads consent without creating a preference record.
   *
   * @return current student's preferences, defaulting to opt out
   */
  RecognitionPreferencesResponse preferences();
  /**
   * Serializes preference creation and updates under the current student's lock.
   *
   * @param rankingOptIn public ranking consent
   * @return saved preferences
   */
  RecognitionPreferencesResponse setPreferences(boolean rankingOptIn);
}
