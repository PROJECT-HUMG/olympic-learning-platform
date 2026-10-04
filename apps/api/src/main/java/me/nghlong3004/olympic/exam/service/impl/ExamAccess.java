package me.nghlong3004.olympic.exam.service.impl;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.exam.entity.Exam;
import me.nghlong3004.olympic.exam.repository.ExamRepository;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.springframework.stereotype.Component;

/**
 * Loads the live active user and enforces draft ownership.
 * This bean starts no transaction. Update and publish must call the locked lookup
 * from {@code ExamServiceImpl}, which holds the single transaction around the exam row lock.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Component
@RequiredArgsConstructor
public class ExamAccess {
  public static final String STALE = "Exam was updated by someone else";

  private final CurrentUserProvider currentUserProvider;
  private final UserRepository userRepository;
  private final ExamRepository examRepository;

  public User actor() {
    var current = currentUserProvider.getCurrentUser();
    var user = userRepository.findByIdAndDeletedAtIsNull(current.id())
        .orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);
    user.requireActiveForAuth();
    return user;
  }

  public User requireStaff() {
    var user = actor();
    if (!staff(user)) {
      throw ErrorCode.ACCESS_DENIED.throwIt();
    }
    return user;
  }

  public boolean staff(User user) {
    if (user == null || user.getRole() == null) {
      return false;
    }
    return user.getRole() == Role.LECTURER || user.getRole() == Role.ADMIN;
  }

  public Exam requireOwned(UUID examId) {
    var user = requireStaff();
    var exam = examRepository.findById(examId).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    if (!owns(user, exam)) {
      throw ErrorCode.RESOURCE_NOT_FOUND.throwIt();
    }
    return exam;
  }

  public Exam requireOwnedLocked(UUID examId) {
    var user = requireStaff();
    var exam = examRepository.findForUpdateById(examId)
        .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    if (!owns(user, exam)) {
      throw ErrorCode.RESOURCE_NOT_FOUND.throwIt();
    }
    return exam;
  }

  public void requireExpected(Exam exam, Long expectedVersion) {
    if (expectedVersion == null || expectedVersion.longValue() != exam.getVersion()) {
      throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt(STALE);
    }
  }

  private boolean owns(User user, Exam exam) {
    return user.getRole() == Role.ADMIN || user.getId().equals(exam.getCreatedById());
  }
}
