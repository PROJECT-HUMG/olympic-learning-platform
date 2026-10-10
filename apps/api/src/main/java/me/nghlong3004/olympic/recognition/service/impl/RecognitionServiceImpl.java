package me.nghlong3004.olympic.recognition.service.impl;

import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.recognition.dto.AchievementMappingSource;
import me.nghlong3004.olympic.recognition.dto.RecognitionDownload;
import me.nghlong3004.olympic.recognition.mapper.RecognitionMapper;
import me.nghlong3004.olympic.recognition.entity.Achievement;
import me.nghlong3004.olympic.recognition.entity.Honor;
import me.nghlong3004.olympic.recognition.entity.HonorParticipant;
import me.nghlong3004.olympic.recognition.entity.RecognitionFile;
import me.nghlong3004.olympic.recognition.entity.RecognitionPreference;
import me.nghlong3004.olympic.recognition.enums.AchievementStatus;
import me.nghlong3004.olympic.recognition.enums.HonorStatus;
import me.nghlong3004.olympic.recognition.repository.AchievementRepository;
import me.nghlong3004.olympic.recognition.repository.HonorRepository;
import me.nghlong3004.olympic.recognition.repository.RecognitionFileRepository;
import me.nghlong3004.olympic.recognition.repository.RecognitionPreferenceRepository;
import me.nghlong3004.olympic.recognition.request.ReviewAchievementRequest;
import me.nghlong3004.olympic.recognition.request.SaveHonorRequest;
import me.nghlong3004.olympic.recognition.request.SubmitAchievementRequest;
import me.nghlong3004.olympic.recognition.response.AchievementResponse;
import me.nghlong3004.olympic.recognition.response.HonorResponse;
import me.nghlong3004.olympic.recognition.response.RankingResponse;
import me.nghlong3004.olympic.recognition.response.RecognitionFileResponse;
import me.nghlong3004.olympic.recognition.response.RecognitionPreferencesResponse;
import me.nghlong3004.olympic.recognition.response.RecognitionProfileResponse;
import me.nghlong3004.olympic.recognition.service.RecognitionPointsPolicy;
import me.nghlong3004.olympic.recognition.service.RecognitionService;
import me.nghlong3004.olympic.recognition.service.RecognitionUploadPolicy;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.service.UserService;
import me.nghlong3004.olympic.recognition.response.PublicAchievementResponse;
import me.nghlong3004.olympic.recognition.response.HonorParticipantResponse;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecognitionServiceImpl implements RecognitionService {
  private final HonorRepository honors;
  private final AchievementRepository achievements;
  private final RecognitionFileRepository files;
  private final RecognitionPreferenceRepository preferences;
  private final UserRepository users;
  private final UserService userService;
  private final CurrentUserProvider currentUserProvider;
  private final RecognitionUploadPolicy uploads;
  private final Clock clock;
  private final RecognitionMapper mapper;

  @Override
  public Page<HonorResponse> listHonors(Integer year, String subject, int page, int size, boolean admin) {
    if (admin) requireAdmin();
    validateYear(year);
    if (subject != null && subject.length() > 100) throw ErrorCode.VALIDATION_ERROR.throwIt("Subject must be at most 100 characters");
    // Empty text means no filter and retains a concrete JDBC VARCHAR type for PostgreSQL.
    return honors.filter(admin, HonorStatus.PUBLISHED, year, StringUtils.hasText(subject) ? subject.trim() : "",
        page(page, size, Sort.by(Sort.Order.desc("year"), Sort.Order.desc("createdAt"), Sort.Order.asc("id"))))
        .map(honor -> honorResponse(honor, admin));
  }

  @Override
  public HonorResponse getHonor(UUID id, boolean admin) {
    if (admin) requireAdmin();
    return honorResponse(readHonor(id, admin), admin);
  }

  @Transactional
  @Override
  public HonorResponse saveHonor(UUID id, SaveHonorRequest request) {
    var admin = requireAdmin();
    var now = OffsetDateTime.now(clock);
    var honor = id == null ? Honor.builder().createdBy(admin.getId()).createdAt(now).build() : lockHonor(id);
    if (id != null) checkVersion(honor.getVersion(), request.expectedVersion());
    if (request.participants() == null || request.participants().size() > 200) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("Provide at most 200 participants");
    }
    var participants = new ArrayList<HonorParticipant>();
    for (var participant : request.participants()) {
      if (participant == null) throw ErrorCode.VALIDATION_ERROR.throwIt("Participant is required");
      if (participant.userId() != null) {
        var user = users.findByIdAndDeletedAtIsNull(participant.userId()).orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);
        participants.add(new HonorParticipant(user.getId(), name(user), clean(participant.award())));
      } else {
        if (!StringUtils.hasText(participant.fullName())) throw ErrorCode.VALIDATION_ERROR.throwIt("Historical participant name is required");
        participants.add(new HonorParticipant(null, participant.fullName().trim(), clean(participant.award())));
      }
    }
    honor.setTitle(request.title().trim());
    honor.setSubject(request.subject().trim());
    honor.setYear(request.year());
    honor.setDescription(clean(request.description()));
    honor.setScope(request.scope());
    honor.setStatus(request.status());
    honor.getParticipants().clear();
    honor.getParticipants().addAll(participants);
    honor.setUpdatedAt(now);
    honors.saveAndFlush(honor);
    log.info("Honor saved: honorId={} status={}", honor.getId(), honor.getStatus());
    return honorResponse(honor, true);
  }

  @Transactional
  @Override
  public void deleteHonor(UUID id) {
    requireAdmin();
    honors.delete(lockHonor(id));
    log.info("Honor deleted: honorId={}", id);
  }

  @Transactional
  @Override
  public HonorResponse addPhotos(UUID id, List<MultipartFile> incoming) {
    requireAdmin();
    var honor = honors.findForPhotoUpdateById(id).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    var existing = files.metadataForHonor(id);
    var validated = uploads.validate(incoming, false, existing.size());
    int position = existing.stream().mapToInt(RecognitionFileRepository.Metadata::getPosition).max().orElse(-1) + 1;
    for (var file : validated) {
      file.setHonorId(id);
      file.setPosition(position++);
    }
    files.saveAllAndFlush(validated);
    honor.setUpdatedAt(OffsetDateTime.now(clock));
    honors.flush();
    log.info("Honor photos added: honorId={} count={}", id, validated.size());
    return honorResponse(honor, true);
  }

  @Transactional
  @Override
  public HonorResponse removePhoto(UUID id, UUID photoId) {
    requireAdmin();
    var honor = honors.findForPhotoUpdateById(id).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    var file = files.findById(photoId).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    if (!id.equals(file.getHonorId())) throw ErrorCode.RESOURCE_NOT_FOUND.throwIt();
    files.delete(file);
    files.flush();
    honor.setUpdatedAt(OffsetDateTime.now(clock));
    honors.flush();
    return honorResponse(honor, true);
  }

  @Override
  public RecognitionDownload getPhoto(UUID id, UUID photoId, boolean admin) {
    if (admin) requireAdmin();
    readHonor(id, admin);
    var file = files.findById(photoId).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    if (!id.equals(file.getHonorId())) throw ErrorCode.RESOURCE_NOT_FOUND.throwIt();
    return download(file);
  }

  @Override
  public List<AchievementResponse> listMyAchievements() {
    var owner = requireStudent(actor());
    return achievements.findByUserIdOrderByAchievedDateDescCreatedAtDesc(owner.getId()).stream()
        .map(record -> achievementResponse(record, owner, true)).toList();
  }

  @Transactional
  @Override
  public AchievementResponse submitAchievement(SubmitAchievementRequest request, List<MultipartFile> evidence, boolean admin) {
    var submitter = admin ? requireAdmin() : requireStudent(actor());
    UUID ownerId = admin ? request.userId() : submitter.getId();
    if (ownerId == null) throw ErrorCode.VALIDATION_ERROR.throwIt("Student userId is required");
    if (!admin && request.userId() != null && !request.userId().equals(ownerId)) throw ErrorCode.ACCESS_DENIED.throwIt();
    var owner = requireStudent(users.findForUpdateById(ownerId).orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt));
    requirePendingCapacity(ownerId);
    validateClaim(request);
    var proof = uploads.validate(evidence, true, 0);
    var now = OffsetDateTime.now(clock);
    var achievement = Achievement.builder().userId(ownerId).submittedBy(submitter.getId()).createdAt(now).build();
    applyClaim(achievement, request, now);
    persistClaim(achievement);
    persistEvidence(achievement.getId(), proof);
    log.info("Achievement submitted: achievementId={} studentId={}", achievement.getId(), ownerId);
    return achievementResponse(achievement, owner, true);
  }

  @Transactional
  @Override
  public AchievementResponse updateAchievement(UUID id, SubmitAchievementRequest request, List<MultipartFile> evidence) {
    var owner = requireStudent(actor());
    // Match submission lock order (student, then achievement) so concurrent resubmissions cannot deadlock.
    users.findForUpdateById(owner.getId()).orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);
    // Proof replacement must advance the review version even when metadata is identical.
    var achievement = achievements.findForResubmissionById(id).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    if (!owner.getId().equals(achievement.getUserId())) throw ErrorCode.ACCESS_DENIED.throwIt();
    if (achievement.getStatus() == AchievementStatus.APPROVED) throw ErrorCode.RECOGNITION_CONFLICT.throwIt("Revoke approval before editing an approved achievement");
    if (achievement.getStatus() != AchievementStatus.PENDING) requirePendingCapacity(owner.getId());
    if (request.userId() != null && !owner.getId().equals(request.userId())) throw ErrorCode.ACCESS_DENIED.throwIt();
    validateClaim(request);
    var proof = uploads.validate(evidence, true, 0);
    applyClaim(achievement, request, OffsetDateTime.now(clock));
    persistClaim(achievement);
    files.deleteForAchievement(id);
    persistEvidence(id, proof);
    log.info("Achievement resubmitted: achievementId={}", id);
    return achievementResponse(achievement, owner, true);
  }

  @Transactional
  @Override
  public AchievementResponse setVisibility(UUID id, boolean publicVisible) {
    var owner = requireStudent(actor());
    var achievement = ownAchievement(id, owner.getId());
    achievement.setPublicVisible(publicVisible);
    achievement.setUpdatedAt(OffsetDateTime.now(clock));
    achievements.flush();
    return achievementResponse(achievement, owner, true);
  }

  @Override
  public RecognitionDownload getEvidence(UUID id, UUID attachmentId) {
    var actor = actor();
    var achievement = achievements.findById(id).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    if (!actor.getId().equals(achievement.getUserId()) && actor.getRole() != Role.ADMIN) throw ErrorCode.ACCESS_DENIED.throwIt();
    var file = files.findById(attachmentId).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    if (!id.equals(file.getAchievementId())) throw ErrorCode.RESOURCE_NOT_FOUND.throwIt();
    return download(file);
  }

  @Override
  public Page<AchievementResponse> adminListAchievements(AchievementStatus status, UUID userId, int page, int size) {
    requireAdmin();
    return achievements.filter(status, userId, page(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id"))))
        .map(record -> achievementResponse(record, users.findById(record.getUserId()).orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt), true));
  }

  @Transactional
  @Override
  public AchievementResponse reviewAchievement(UUID id, ReviewAchievementRequest request) {
    var admin = requireAdmin();
    var achievement = achievements.findForUpdateById(id).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    checkVersion(achievement.getVersion(), request.expectedVersion());
    var target = request.status();
    if (target == null || target == AchievementStatus.PENDING) throw ErrorCode.VALIDATION_ERROR.throwIt("Choose APPROVED, REJECTED or REVOKED");
    var owner = users.findById(achievement.getUserId()).orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);
    if (target == achievement.getStatus()) return achievementResponse(achievement, owner, true);
    boolean decision = achievement.getStatus() == AchievementStatus.PENDING && (target == AchievementStatus.APPROVED || target == AchievementStatus.REJECTED);
    boolean revoke = achievement.getStatus() == AchievementStatus.APPROVED && target == AchievementStatus.REVOKED;
    if (!decision && !revoke) throw ErrorCode.RECOGNITION_CONFLICT.throwIt("Resubmit rejected/revoked records before reviewing again");
    if (target != AchievementStatus.APPROVED && !StringUtils.hasText(request.note())) throw ErrorCode.VALIDATION_ERROR.throwIt("A rejection or revocation reason is required");
    if (target == AchievementStatus.APPROVED) {
      requireStudent(owner);
      if (files.metadataForAchievement(id).isEmpty()) throw ErrorCode.VALIDATION_ERROR.throwIt("Evidence is required for approval");
      RecognitionPointsPolicy.validate(achievement.getCategory(), achievement.getAward(), achievement.isIncludeParticipation());
    }
    achievement.setStatus(target);
    achievement.setReviewedBy(admin.getId());
    achievement.setReviewNote(clean(request.note()));
    achievement.setReviewedAt(OffsetDateTime.now(clock));
    achievement.setUpdatedAt(OffsetDateTime.now(clock));
    persistClaim(achievement);
    log.info("Achievement reviewed: achievementId={} status={} reviewerId={}", id, target, admin.getId());
    return achievementResponse(achievement, owner, true);
  }

  @Override
  public Page<RankingResponse> rankings(Integer year, int page, int size) {
    validateYear(year);
    var result = achievements.rankings(year, page(page, size, Sort.unsorted()));
    var identities = userService.publicIdentities(result.stream().map(AchievementRepository.RankingProjection::getUserId).toList());
    return result.map(row -> {
      var identity = identities.get(row.getUserId());
      return new RankingResponse(row.getRank(), row.getUserId(), row.getFullName(), row.getUsername(),
          row.getTotalPoints(), row.getApprovedCount(), identity == null ? null : identity.avatarUrl(),
          identity == null ? null : identity.avatarCrop());
    });
  }

  @Override
  public RecognitionProfileResponse profile(UUID userId) {
    var identity = userService.publicIdentities(List.of(userId)).get(userId);
    if (identity == null) throw ErrorCode.USER_NOT_FOUND.throwIt();
    var published = achievements.findByUserIdAndStatusAndPublicVisibleTrueOrderByAchievedDateDescCreatedAtDesc(userId, AchievementStatus.APPROVED)
        .stream().map(record -> new PublicAchievementResponse(record.getId(), record.getTitle(),
            record.getDescription(), record.getCategory(), record.getAward(), record.isIncludeParticipation(),
            record.getAchievedDate(), true, AchievementStatus.APPROVED, record.getAwardPoints(),
            record.getParticipationPoints(), record.getAwardPoints() + record.getParticipationPoints())).toList();
    long publicPoints = published.stream().mapToLong(PublicAchievementResponse::totalPoints).sum();
    return new RecognitionProfileResponse(userId,
        StringUtils.hasText(identity.fullName()) ? identity.fullName() : identity.username(), identity.username(),
        identity.avatarUrl(), identity.avatarCrop(),
        preferences.findById(userId).map(RecognitionPreference::isRankingOptIn).orElse(false), publicPoints, published);
  }

  @Override
  public RecognitionPreferencesResponse preferences() {
    var user = requireStudent(actor());
    return new RecognitionPreferencesResponse(preferences.findById(user.getId()).map(RecognitionPreference::isRankingOptIn).orElse(false));
  }

  @Transactional
  @Override
  public RecognitionPreferencesResponse setPreferences(boolean rankingOptIn) {
    var current = requireStudent(actor());
    requireStudent(users.findForUpdateById(current.getId()).orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt));
    var preference = preferences.findById(current.getId()).orElseGet(() -> RecognitionPreference.builder().userId(current.getId()).build());
    preference.setRankingOptIn(rankingOptIn);
    preferences.saveAndFlush(preference);
    return new RecognitionPreferencesResponse(rankingOptIn);
  }

  private User actor() {
    var current = currentUserProvider.getCurrentUser();
    var user = users.findByIdAndDeletedAtIsNull(current.id()).orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);
    user.requireActiveForAuth();
    return user;
  }

  private User requireAdmin() {
    var user = actor();
    if (user.getRole() != Role.ADMIN) throw ErrorCode.ACCESS_DENIED.throwIt();
    return user;
  }

  private User requireStudent(User user) {
    user.requireActiveForAuth();
    if (user.getRole() != Role.STUDENT) throw ErrorCode.ACCESS_DENIED.throwIt("Academic achievements are for students");
    return user;
  }

  private Honor lockHonor(UUID id) {
    return honors.findForUpdateById(id).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
  }

  private Honor readHonor(UUID id, boolean admin) {
    var honor = honors.findById(id).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    if (!admin && honor.getStatus() != HonorStatus.PUBLISHED) throw ErrorCode.RESOURCE_NOT_FOUND.throwIt();
    return honor;
  }

  private Achievement ownAchievement(UUID id, UUID ownerId) {
    var achievement = achievements.findForUpdateById(id).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    if (!ownerId.equals(achievement.getUserId())) throw ErrorCode.ACCESS_DENIED.throwIt();
    return achievement;
  }

  private void validateClaim(SubmitAchievementRequest request) {
    if (request.achievedDate() == null || request.achievedDate().isAfter(LocalDate.now(clock))
        || request.achievedDate().getYear() < 1900) throw ErrorCode.VALIDATION_ERROR.throwIt("Achievement date must be between 1900 and today");
    RecognitionPointsPolicy.validate(request.category(), request.award(), request.includeParticipation());
  }

  private void requirePendingCapacity(UUID ownerId) {
    if (achievements.countByUserIdAndStatus(ownerId, AchievementStatus.PENDING) >= 50) {
      throw ErrorCode.RECOGNITION_CONFLICT.throwIt("Review pending submissions before adding more (maximum 50 pending records)");
    }
  }

  private void applyClaim(Achievement achievement, SubmitAchievementRequest request, OffsetDateTime now) {
    achievement.setTitle(request.title().trim());
    achievement.setDescription(clean(request.description()));
    achievement.setCategory(request.category());
    achievement.setAward(request.award());
    achievement.setIncludeParticipation(request.includeParticipation());
    achievement.setAchievedDate(request.achievedDate());
    achievement.setPublicVisible(request.publicVisible() == null || request.publicVisible());
    achievement.setStatus(AchievementStatus.PENDING);
    achievement.setAwardPoints(RecognitionPointsPolicy.awardPoints(request.category(), request.award()));
    achievement.setParticipationPoints(RecognitionPointsPolicy.participationPoints(request.category(), request.includeParticipation()));
    achievement.setReviewedBy(null);
    achievement.setReviewNote(null);
    achievement.setReviewedAt(null);
    achievement.setUpdatedAt(now);
  }

  private void persistClaim(Achievement achievement) {
    try {
      achievements.saveAndFlush(achievement);
    } catch (DataIntegrityViolationException exception) {
      throw ErrorCode.RECOGNITION_DUPLICATE.throwIt();
    }
  }

  private void persistEvidence(UUID achievementId, List<RecognitionFile> proof) {
    int position = 0;
    for (var file : proof) {
      file.setAchievementId(achievementId);
      file.setPosition(position++);
    }
    files.saveAllAndFlush(proof);
  }

  private HonorResponse honorResponse(Honor honor, boolean admin) {
    var prefix = admin && honor.getStatus() == HonorStatus.DRAFT ? "/api/v1/admin/recognition/honors/" : "/api/v1/recognition/honors/";
    var photos = files.metadataForHonor(honor.getId()).stream().map(file ->
        mapper.toFile(file, prefix + honor.getId() + "/photos/" + file.getId())).toList();
    var identities = userService.publicIdentities(honor.getParticipants().stream()
        .map(HonorParticipant::getUserId).filter(Objects::nonNull).toList());
    var participants = honor.getParticipants().stream().map(person -> {
      var identity = identities.get(person.getUserId());
      return new HonorParticipantResponse(person.getUserId(), person.getFullName(), person.getAward(),
          identity == null ? null : identity.avatarUrl(), identity == null ? null : identity.avatarCrop(), identity != null);
    }).toList();
    return mapper.toHonor(honor, participants, photos);
  }

  private AchievementResponse achievementResponse(Achievement record, User owner, boolean privileged) {
    var evidence = privileged
        ? files.metadataForAchievement(record.getId()).stream().map(file -> mapper.toFile(file, null)).toList()
        : List.<RecognitionFileResponse>of();
    return mapper.toAchievement(new AchievementMappingSource(record, name(owner),
        privileged ? record.getReviewNote() : null, privileged ? record.getReviewedAt() : null,
        record.getAwardPoints() + record.getParticipationPoints(), evidence));
  }

  private RecognitionDownload download(RecognitionFile file) {
    return mapper.toDownload(file);
  }

  private Pageable page(int page, int size, Sort sort) {
    if (page < 0 || size < 1 || size > 50) throw ErrorCode.VALIDATION_ERROR.throwIt("Page must be nonnegative; size must be 1 to 50");
    return PageRequest.of(page, size, sort);
  }

  private void validateYear(Integer year) {
    if (year != null && (year < 1900 || year > 2100)) throw ErrorCode.VALIDATION_ERROR.throwIt("Year must be between 1900 and 2100");
  }

  private void checkVersion(long version, Long expected) {
    if (expected == null || version != expected) throw ErrorCode.RECOGNITION_CONFLICT.throwIt("Reload the record before saving");
  }

  private String clean(String value) { return StringUtils.hasText(value) ? value.trim() : null; }
  private String name(User user) { return StringUtils.hasText(user.getFullName()) ? user.getFullName() : user.getUsername(); }
}
