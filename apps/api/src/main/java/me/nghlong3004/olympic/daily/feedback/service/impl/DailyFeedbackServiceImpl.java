package me.nghlong3004.olympic.daily.feedback.service.impl;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.daily.feedback.entity.DailyFeedback;
import me.nghlong3004.olympic.daily.feedback.mapper.DailyFeedbackMapper;
import me.nghlong3004.olympic.daily.feedback.repository.DailyFeedbackRepository;
import me.nghlong3004.olympic.daily.feedback.request.SaveDailyFeedbackRequest;
import me.nghlong3004.olympic.daily.feedback.response.DailyFeedbackContributionResponse;
import me.nghlong3004.olympic.daily.feedback.response.DailyFeedbackResponse;
import me.nghlong3004.olympic.daily.feedback.service.DailyFeedbackService;
import me.nghlong3004.olympic.daily.repository.DailyPlanRepository;
import me.nghlong3004.olympic.daily.repository.DailyWeeklyReviewRepository;
import me.nghlong3004.olympic.daily.sharing.service.SharedDailyAccess;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupRepository;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DailyFeedbackServiceImpl implements DailyFeedbackService {
  private final SharedDailyAccess access;
  private final AccountabilityGroupRepository groups;
  private final DailyPlanRepository plans;
  private final DailyWeeklyReviewRepository weeks;
  private final DailyFeedbackRepository feedback;
  private final DailyFeedbackMapper mapper;
  private final UserRepository users;
  private final Clock clock;

  @Transactional(readOnly = true)
  @Override
  public DailyFeedbackResponse list(UUID groupId, UUID ownerId, String kind, UUID reviewId) {
    access.requireSharedReader(groupId, ownerId);
    requireReview(ownerId, kind, reviewId);
    var rows =
        rows(groupId, kind, reviewId).stream()
            .filter(
                r ->
                    ownerId.equals(r.getOwnerId())
                        && access.visibleTo(groupId, ownerId, r.getAuthorId()))
            .map(this::response)
            .toList();
    return mapper.toResponse(rows, rows.size());
  }

  @Transactional
  @Override
  public DailyFeedbackContributionResponse save(
      UUID groupId, UUID ownerId, String kind, UUID reviewId, SaveDailyFeedbackRequest request) {
    // Group lock makes audience/leave changes and concurrent own create/update mutually ordered.
    groups.findForUpdateById(groupId).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    var actor = access.requireSharedReader(groupId, ownerId);
    if (actor.getId().equals(ownerId)) throw ErrorCode.ACCESS_DENIED.throwIt();
    requireReview(ownerId, kind, reviewId);
    var text = request == null || request.text() == null ? "" : request.text().trim();
    if (text.isEmpty()
        || text.length() > 4000
        || request.expectedVersion() != null && request.expectedVersion() < 0) {
      throw ErrorCode.VALIDATION_ERROR.throwIt(
          "Feedback needs nonblank text of at most 4000 characters");
    }
    var own =
        rows(groupId, kind, reviewId).stream()
            .filter(r -> actor.getId().equals(r.getAuthorId()))
            .findFirst()
            .orElse(null);
    var stamp = OffsetDateTime.now(clock).truncatedTo(ChronoUnit.MICROS);
    if (own == null) {
      if (request.expectedVersion() != null) throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt();
      own =
          DailyFeedback.builder()
              .groupId(groupId)
              .ownerId(ownerId)
              .authorId(actor.getId())
              .planId("plans".equals(kind) ? reviewId : null)
              .weeklyReviewId("weeks".equals(kind) ? reviewId : null)
              .createdAt(stamp)
              .updatedAt(stamp)
              .build();
    } else {
      requireVersion(own, request.expectedVersion());
      if (!stamp.isAfter(own.getUpdatedAt())) stamp = own.getUpdatedAt().plus(1, ChronoUnit.MICROS);
      own.setUpdatedAt(stamp);
    }
    own.setText(text);
    feedback.saveAndFlush(own);
    log.info("Daily feedback saved: contributionId={} groupId={}", own.getId(), groupId);
    return response(own);
  }

  @Transactional
  @Override
  public void remove(UUID groupId, UUID ownerId, String kind, UUID reviewId, Long expectedVersion) {
    groups.findForUpdateById(groupId).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    var actor = access.requireSharedReader(groupId, ownerId);
    if (actor.getId().equals(ownerId)) throw ErrorCode.ACCESS_DENIED.throwIt();
    requireReview(ownerId, kind, reviewId);
    var own =
        rows(groupId, kind, reviewId).stream()
            .filter(r -> actor.getId().equals(r.getAuthorId()))
            .findFirst()
            .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    requireVersion(own, expectedVersion);
    feedback.delete(own);
    feedback.flush();
    log.info("Daily feedback removed: contributionId={}", own.getId());
  }

  private void requireReview(UUID ownerId, String kind, UUID id) {
    UUID actual;
    if ("plans".equals(kind))
      actual = plans.findById(id).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt).getOwnerId();
    else if ("weeks".equals(kind))
      actual = weeks.findById(id).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt).getOwnerId();
    else throw ErrorCode.RESOURCE_NOT_FOUND.throwIt();
    if (!ownerId.equals(actual)) throw ErrorCode.RESOURCE_NOT_FOUND.throwIt();
  }

  private List<DailyFeedback> rows(UUID groupId, String kind, UUID id) {
    return "plans".equals(kind)
        ? feedback.findByGroupIdAndPlanIdOrderByCreatedAtAscIdAsc(groupId, id)
        : feedback.findByGroupIdAndWeeklyReviewIdOrderByCreatedAtAscIdAsc(groupId, id);
  }

  private void requireVersion(DailyFeedback own, Long version) {
    if (version == null || !version.equals(own.getVersion()))
      throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt();
  }

  private DailyFeedbackContributionResponse response(DailyFeedback row) {
    var user = users.findById(row.getAuthorId()).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    return mapper.toContribution(row, user);
  }
}
