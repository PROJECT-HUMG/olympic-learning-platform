package me.nghlong3004.olympic.assessment.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.assessment.entity.AssessmentImport;
import me.nghlong3004.olympic.assessment.entity.AssessmentQuestionDraft;
import me.nghlong3004.olympic.assessment.enums.AssessmentDraftStatus;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportPhase;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportStatus;
import me.nghlong3004.olympic.assessment.mapper.AssessmentImportMapper;
import me.nghlong3004.olympic.assessment.repository.AssessmentImportRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftAssetRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftRepository;
import me.nghlong3004.olympic.assessment.response.AssessmentImportStatusResponse;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.question.dto.ImportedQuestion;
import me.nghlong3004.olympic.question.service.QuestionImportService;
import me.nghlong3004.olympic.user.entity.User;
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
class AssessmentPublicationServiceImplTest {
  @Mock private AssessmentImportRepository importRepository;
  @Mock private AssessmentQuestionDraftRepository draftRepository;
  @Mock private AssessmentQuestionDraftAssetRepository draftAssetRepository;
  @Mock private QuestionImportService questionImportService;
  @Mock private CurrentUserProvider currentUserProvider;
  @Mock private AssessmentImportMapper assessmentImportMapper;
  @InjectMocks private AssessmentPublicationServiceImpl service;

  @Test
  void publishesApprovedDraftsAndSkipsRejectedDrafts() {
    var fixture = fixture(AssessmentImportStatus.REVIEW_REQUIRED);
    var approved = draft(fixture.assessmentImport(), AssessmentDraftStatus.APPROVED);
    var rejected = draft(fixture.assessmentImport(), AssessmentDraftStatus.REJECTED);
    var command = importedQuestion(approved.getId(), fixture.userId());
    when(draftRepository.findByAssessmentImportIdOrderByOrdinalAsc(fixture.importId()))
        .thenReturn(List.of(approved, rejected));
    when(assessmentImportMapper.toImportedQuestion(approved, fixture.userId(), List.of()))
        .thenReturn(command);
    when(importRepository.save(fixture.assessmentImport())).thenReturn(fixture.assessmentImport());
    when(assessmentImportMapper.toStatusResponse(fixture.assessmentImport()))
        .thenReturn(statusResponse(fixture.importId()));

    var response = service.publish(fixture.importId());

    assertThat(response.status()).isEqualTo(AssessmentImportStatus.PUBLISHED);
    verify(questionImportService).publishAll(List.of(command));
    verify(assessmentImportMapper, never())
        .toImportedQuestion(rejected, fixture.userId(), List.of());
  }

  @Test
  void blocksPublishWhileAnyDraftNeedsReview() {
    var fixture = fixture(AssessmentImportStatus.REVIEW_REQUIRED);
    var pending = draft(fixture.assessmentImport(), AssessmentDraftStatus.NEEDS_REVIEW);
    when(draftRepository.findByAssessmentImportIdOrderByOrdinalAsc(fixture.importId()))
        .thenReturn(List.of(pending));

    assertThatThrownBy(() -> service.publish(fixture.importId()))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.RESOURCE_STATE_CONFLICT);
    verifyNoInteractions(questionImportService);
  }

  @Test
  void returnsPublishedImportWithoutCreatingQuestionsAgain() {
    var fixture = fixture(AssessmentImportStatus.PUBLISHED);
    var expected = statusResponse(fixture.importId());
    when(assessmentImportMapper.toStatusResponse(fixture.assessmentImport())).thenReturn(expected);

    assertThat(service.publish(fixture.importId())).isSameAs(expected);
    verifyNoInteractions(draftRepository, questionImportService);
  }

  private Fixture fixture(AssessmentImportStatus status) {
    var importId = UUID.randomUUID();
    var userId = UUID.randomUUID();
    var user = User.builder().id(userId).build();
    var assessmentImport =
        AssessmentImport.builder().id(importId).createdBy(user).status(status).build();
    when(currentUserProvider.getCurrentUser())
        .thenReturn(CurrentUser.builder().id(userId).role(Role.LECTURER).build());
    when(importRepository.findForUpdateById(importId)).thenReturn(Optional.of(assessmentImport));
    return new Fixture(importId, userId, assessmentImport);
  }

  private AssessmentQuestionDraft draft(
      AssessmentImport assessmentImport, AssessmentDraftStatus status) {
    return AssessmentQuestionDraft.builder()
        .id(UUID.randomUUID())
        .assessmentImport(assessmentImport)
        .status(status)
        .build();
  }

  private ImportedQuestion importedQuestion(UUID draftId, UUID creatorId) {
    var content = JsonNodeFactory.instance.objectNode().put("text", "Question");
    var answer = JsonNodeFactory.instance.objectNode().put("value", "Answer");
    return new ImportedQuestion(
        draftId,
        UUID.randomUUID(),
        UUID.randomUUID(),
        creatorId,
        "multiple_choice",
        content,
        answer,
        null,
        null,
        List.of());
  }

  private AssessmentImportStatusResponse statusResponse(UUID importId) {
    var now = OffsetDateTime.now();
    return new AssessmentImportStatusResponse(
        importId,
        AssessmentImportStatus.PUBLISHED,
        AssessmentImportPhase.PUBLISHED,
        100,
        1,
        1,
        1,
        0,
        null,
        now,
        now);
  }

  private record Fixture(UUID importId, UUID userId, AssessmentImport assessmentImport) {}
}
