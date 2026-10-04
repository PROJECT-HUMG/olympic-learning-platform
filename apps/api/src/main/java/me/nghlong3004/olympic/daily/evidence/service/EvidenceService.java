package me.nghlong3004.olympic.daily.evidence.service;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.daily.evidence.dto.EvidenceDownload;
import me.nghlong3004.olympic.daily.evidence.enums.EvidenceStage;
import me.nghlong3004.olympic.daily.evidence.request.CreateEvidenceLinkRequest;
import me.nghlong3004.olympic.daily.evidence.response.EvidenceMetadataResponse;
import org.springframework.web.multipart.MultipartFile;

/**
 * Saved-task evidence with current authorization on every metadata and byte request.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public interface EvidenceService {
  /**
   * Lists metadata after checking current account, actual parent and optional group permission.
   *
   * @param planId saved parent plan
   * @param taskId saved task in that plan
   * @param groupId group for nonowner access, or null for personal access
   * @return currently permitted metadata
   */
  List<EvidenceMetadataResponse> list(UUID planId, UUID taskId, UUID groupId);

  /**
   * Stores original private bytes under the saved parent's lock, without updating that plan.
   *
   * @param planId owned saved plan
   * @param taskId owned saved task
   * @param stage START or FINISH
   * @param file nonempty file at most 5 MiB
   * @return complete persisted metadata record
   */
  EvidenceMetadataResponse createFile(
      UUID planId, UUID taskId, EvidenceStage stage, MultipartFile file);

  /**
   * Stores a bounded HTTP(S) link without fetching its destination.
   *
   * @param planId owned saved plan
   * @param taskId owned saved task
   * @param request stage, URL and label
   * @return complete persisted metadata record
   */
  EvidenceMetadataResponse createLink(UUID planId, UUID taskId, CreateEvidenceLinkRequest request);

  /**
   * Reads original bytes only after current permission and all nested identity checks.
   *
   * @param planId saved parent plan
   * @param taskId saved task
   * @param evidenceId FILE evidence on that task
   * @param groupId current group context, or null for personal access
   * @return private attachment bytes and safe filename
   */
  EvidenceDownload download(UUID planId, UUID taskId, UUID evidenceId, UUID groupId);

  /**
   * Removes owned evidence under the same parent lock used by task deletion and creation.
   *
   * @param planId owned saved plan
   * @param taskId owned saved task
   * @param evidenceId evidence on that task
   */
  void remove(UUID planId, UUID taskId, UUID evidenceId);
}
