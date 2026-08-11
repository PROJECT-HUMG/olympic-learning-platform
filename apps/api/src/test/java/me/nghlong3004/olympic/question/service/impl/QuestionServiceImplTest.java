package me.nghlong3004.olympic.question.service.impl;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.question.entity.Question;
import me.nghlong3004.olympic.question.enums.QuestionStatus;
import me.nghlong3004.olympic.question.repository.QuestionAssetRepository;
import me.nghlong3004.olympic.question.repository.QuestionRepository;
import me.nghlong3004.olympic.user.enums.Role;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@ExtendWith(MockitoExtension.class)
class QuestionServiceImplTest {
  @Mock private QuestionRepository questionRepository;
  @Mock private QuestionAssetRepository questionAssetRepository;
  @Mock private CurrentUserProvider currentUserProvider;
  @InjectMocks private QuestionServiceImpl service;

  @Test
  void cannotArchiveDraftQuestion() {
    var id = UUID.randomUUID();
    var question = Question.builder().id(id).status(QuestionStatus.DRAFT).build();
    when(currentUserProvider.getCurrentUser())
        .thenReturn(
            CurrentUser.builder().id(UUID.randomUUID()).role(Role.LECTURER).build());
    when(questionRepository.findByIdAndCreatedById(eq(id), any()))
        .thenReturn(Optional.of(question));

    assertThatThrownBy(() -> service.archive(id))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.RESOURCE_STATE_CONFLICT);
    verify(questionRepository, never()).save(any());
  }
}
