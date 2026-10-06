package me.nghlong3004.olympic.daily.evidence.service.impl;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.daily.entity.DailyTask;
import me.nghlong3004.olympic.daily.evidence.dto.EvidenceDownload;
import me.nghlong3004.olympic.daily.evidence.entity.DailyEvidence;
import me.nghlong3004.olympic.daily.evidence.enums.EvidenceKind;
import me.nghlong3004.olympic.daily.evidence.enums.EvidenceStage;
import me.nghlong3004.olympic.daily.evidence.mapper.EvidenceMapper;
import me.nghlong3004.olympic.daily.evidence.repository.DailyEvidenceRepository;
import me.nghlong3004.olympic.daily.evidence.request.CreateEvidenceLinkRequest;
import me.nghlong3004.olympic.daily.evidence.response.EvidenceMetadataResponse;
import me.nghlong3004.olympic.daily.evidence.service.EvidenceService;
import me.nghlong3004.olympic.daily.repository.DailyPlanRepository;
import me.nghlong3004.olympic.group.enums.MembershipStatus;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupMembershipRepository;
import me.nghlong3004.olympic.group.service.GroupDailyAccess;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EvidenceServiceImpl implements EvidenceService {
  private static final int MAX_BYTES = 5 * 1024 * 1024;
  private static final int MAX_ITEMS = 10;
  private final DailyEvidenceRepository evidence;
  private final EvidenceMapper mapper;
  private final DailyPlanRepository plans;
  private final UserRepository users;
  private final CurrentUserProvider currentUser;
  private final AccountabilityGroupMembershipRepository memberships;
  private final GroupDailyAccess groupAccess;
  private final Clock clock;

  @Transactional
  @Override
  public List<EvidenceMetadataResponse> list(UUID planId, UUID taskId, UUID groupId) {
    var task = requireTask(planId, taskId, groupId, false);
    return evidence.findByTask_IdOrderByCreatedAtAscIdAsc(task.getId()).stream()
        .map(mapper::toMetadata)
        .toList();
  }

  @Transactional
  @Override
  public EvidenceMetadataResponse createFile(
      UUID planId, UUID taskId, EvidenceStage stage, MultipartFile file) {
    var task = requireTask(planId, taskId, null, true);
    requireStage(stage);
    requireRoom(taskId);
    if (file == null || file.isEmpty() || file.getSize() > MAX_BYTES) {
      throw invalid("A nonempty file of at most 5 MiB is required");
    }
    byte[] bytes;
    try (var input = file.getInputStream()) {
      bytes = input.readNBytes(MAX_BYTES + 1);
    } catch (IOException exception) {
      throw invalid("The evidence file could not be read");
    }
    if (bytes.length == 0 || bytes.length > MAX_BYTES) {
      throw invalid("A nonempty file of at most 5 MiB is required");
    }
    var row =
        DailyEvidence.builder()
            .task(task)
            .stage(stage)
            .kind(EvidenceKind.FILE)
            .originalName(filename(file.getOriginalFilename()))
            .contentType(contentType(file.getContentType()))
            .sizeBytes((long) bytes.length)
            .content(bytes)
            .createdAt(OffsetDateTime.now(clock))
            .build();
    return persist(row);
  }

  @Transactional
  @Override
  public EvidenceMetadataResponse createLink(
      UUID planId, UUID taskId, CreateEvidenceLinkRequest request) {
    var task = requireTask(planId, taskId, null, true);
    if (request == null) throw invalid("Evidence link data is required");
    requireStage(request.stage());
    var url = requireUrl(request.url());
    var label = request.label();
    if (label == null || label.isBlank() || label.length() > 200) {
      throw invalid("A nonblank label of at most 200 characters is required");
    }
    requireRoom(taskId);
    return persist(
        DailyEvidence.builder()
            .task(task)
            .stage(request.stage())
            .kind(EvidenceKind.LINK)
            .url(url)
            .label(label.trim())
            .createdAt(OffsetDateTime.now(clock))
            .build());
  }

  @Transactional
  @Override
  public EvidenceDownload download(UUID planId, UUID taskId, UUID evidenceId, UUID groupId) {
    requireTask(planId, taskId, groupId, false);
    var row = requireEvidence(taskId, evidenceId);
    if (row.getKind() != EvidenceKind.FILE) throw missing();
    return mapper.toDownload(row);
  }

  @Transactional
  @Override
  public void remove(UUID planId, UUID taskId, UUID evidenceId) {
    requireTask(planId, taskId, null, true);
    var row = requireEvidence(taskId, evidenceId);
    evidence.delete(row);
    evidence.flush();
    log.info("Daily evidence removed: evidenceId={}, taskId={}", evidenceId, taskId);
  }

  private DailyTask requireTask(UUID planId, UUID taskId, UUID groupId, boolean ownerOnly) {
    var actorId = currentUser.getCurrentUser().id();
    var actor =
        users.findByIdAndDeletedAtIsNull(actorId).orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);
    actor.requireActiveForAuth();
    if (planId == null || taskId == null) throw invalid("Saved plan and task ids are required");
    // All operations share the existing owner plan's task-deletion/submit lock. No parent is
    // dirtied.
    var plan = plans.findForUpdateById(planId).orElseThrow(EvidenceServiceImpl::missing);
    var isOwner = actorId.equals(plan.getOwnerId());
    if (ownerOnly && !isOwner) throw denied();
    if (!isOwner || groupId != null) {
      if (groupId == null) throw denied();
      var owner = users.findByIdAndDeletedAtIsNull(plan.getOwnerId()).orElse(null);
      if (owner == null || !owner.active()) throw denied();
      requireActiveMembership(groupId, plan.getOwnerId());
      requireActiveMembership(groupId, actorId);
      groupAccess.requireViewer(groupId, plan.getOwnerId(), actorId);
    }
    return plan.getTasks().stream()
        .filter(task -> taskId.equals(task.getId()))
        .findFirst()
        .orElseThrow(EvidenceServiceImpl::missing);
  }

  private void requireActiveMembership(UUID groupId, UUID userId) {
    var active =
        memberships
            .findByGroup_IdAndUser_Id(groupId, userId)
            .map(member -> member.getStatus() == MembershipStatus.ACTIVE)
            .orElse(false);
    if (!active) throw denied();
  }

  private DailyEvidence requireEvidence(UUID taskId, UUID id) {
    if (id == null) throw invalid("Evidence id is required");
    return evidence.findByIdAndTask_Id(id, taskId).orElseThrow(EvidenceServiceImpl::missing);
  }

  private void requireRoom(UUID taskId) {
    if (evidence.countByTask_Id(taskId) >= MAX_ITEMS) {
      throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt("A task may have at most 10 evidence items");
    }
  }

  private EvidenceMetadataResponse persist(DailyEvidence row) {
    var saved = evidence.saveAndFlush(row);
    log.info(
        "Daily evidence created: evidenceId={}, taskId={}, kind={}",
        saved.getId(),
        saved.getTask().getId(),
        saved.getKind());
    return mapper.toMetadata(saved);
  }

  private static void requireStage(EvidenceStage stage) {
    if (stage == null) throw invalid("A valid evidence stage is required");
  }

  private static String requireUrl(String value) {
    if (value == null
        || value.isBlank()
        || value.length() > 2048
        || value.chars().anyMatch(Character::isWhitespace))
      throw invalid("A bounded HTTP(S) URL is required");
    try {
      var uri = new URI(value);
      if (!("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme()))
          || uri.getHost() == null
          || uri.getRawUserInfo() != null) {
        throw invalid("An absolute HTTP(S) URL without credentials is required");
      }
    } catch (URISyntaxException exception) {
      throw invalid("An absolute HTTP(S) URL without credentials is required");
    }
    return value;
  }

  private static String filename(String value) {
    var name = value == null ? "evidence.bin" : value.replace('\\', '/');
    name = name.substring(name.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}]", "").trim();
    if (name.isEmpty() || name.equals(".") || name.equals("..")) name = "evidence.bin";
    var points = name.codePoints().limit(255).toArray();
    return new String(points, 0, points.length);
  }

  private static String contentType(String value) {
    if (value == null
        || value.isBlank()
        || value.length() > 255
        || value.chars().anyMatch(Character::isISOControl)) {
      return "application/octet-stream";
    }
    return value;
  }

  private static RuntimeException invalid(String detail) {
    return ErrorCode.VALIDATION_ERROR.throwIt(detail);
  }

  private static RuntimeException missing() {
    return ErrorCode.RESOURCE_NOT_FOUND.throwIt("Evidence resource not found");
  }

  private static RuntimeException denied() {
    return ErrorCode.ACCESS_DENIED.throwIt("Evidence access denied");
  }
}
