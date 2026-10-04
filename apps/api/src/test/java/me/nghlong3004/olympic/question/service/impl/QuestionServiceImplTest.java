package me.nghlong3004.olympic.question.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.Clock;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.document.entity.Subject;
import me.nghlong3004.olympic.document.repository.SubjectRepository;
import me.nghlong3004.olympic.question.entity.Question;
import me.nghlong3004.olympic.question.entity.QuestionAsset;
import me.nghlong3004.olympic.question.enums.QuestionStatus;
import me.nghlong3004.olympic.question.mapper.QuestionMapper;
import me.nghlong3004.olympic.question.repository.QuestionAssetRepository;
import me.nghlong3004.olympic.question.repository.QuestionFigureRepository;
import me.nghlong3004.olympic.question.repository.QuestionRepository;
import me.nghlong3004.olympic.question.request.UpdateQuestionRequest;
import me.nghlong3004.olympic.question.response.QuestionResponse;
import me.nghlong3004.olympic.question.service.QuestionValidationService;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.topic.entity.Topic;
import me.nghlong3004.olympic.topic.repository.TopicRepository;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@ExtendWith(MockitoExtension.class)
class QuestionServiceImplTest {
  @Mock private QuestionRepository questionRepository;
  @Mock private QuestionAssetRepository questionAssetRepository;
  @Mock private QuestionFigureRepository questionFigureRepository;
  @Mock private SubjectRepository subjectRepository;
  @Mock private TopicRepository topicRepository;
  @Mock private UserRepository userRepository;
  @Mock private CurrentUserProvider currentUserProvider;
  @Mock private StorageService storageService;
  @Mock private QuestionValidationService validationService;
  @Spy private QuestionManualContentValidator manualContentValidator = new QuestionManualContentValidator();
  @Spy private QuestionFigurePolicy questionFigurePolicy = new QuestionFigurePolicy();
  @Mock private QuestionMapper questionMapper;
  @Mock private Clock clock;
  @InjectMocks private QuestionServiceImpl service;

  @Test
  void cannotArchiveDraftQuestion() {
    UUID id = UUID.randomUUID();
    UUID owner = UUID.randomUUID();
    Question question = Question.builder().id(id).status(QuestionStatus.DRAFT).build();
    question.setCreatedBy(User.builder().id(owner).build());
    when(currentUserProvider.getCurrentUser())
        .thenReturn(CurrentUser.builder().id(owner).role(Role.LECTURER).build());
    when(questionRepository.findForUpdateById(id)).thenReturn(Optional.of(question));

    assertThatThrownBy(() -> service.archive(id))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.RESOURCE_STATE_CONFLICT);
    verify(questionRepository, never()).save(any());
    verify(questionRepository, never()).saveAndFlush(any());
  }

  @Test
  void restoreRechecksEnabledPlacement() {
    UUID id = UUID.randomUUID();
    UUID owner = UUID.randomUUID();
    UUID subjectId = UUID.randomUUID();
    Question question = Question.builder().id(id).status(QuestionStatus.ARCHIVED)
        .createdBy(User.builder().id(owner).build())
        .subject(Subject.builder().id(subjectId).build()).build();
    when(currentUserProvider.getCurrentUser())
        .thenReturn(CurrentUser.builder().id(owner).role(Role.LECTURER).build());
    when(questionRepository.findForUpdateById(id)).thenReturn(Optional.of(question));
    when(subjectRepository.findByIdAndEnabledTrue(subjectId)).thenReturn(Optional.empty());
    assertThatThrownBy(() -> service.restore(id)).isInstanceOf(ApiException.class)
        .hasMessage("Subject and topic must be enabled");
    assertThat(question.getStatus()).isEqualTo(QuestionStatus.ARCHIVED);
    verify(questionRepository, never()).saveAndFlush(any());
  }

  @Test
  void manualConversionRejectsAttachedLegacyAssetsWithoutChangingContent() {
    UUID id = UUID.randomUUID();
    UUID owner = UUID.randomUUID();
    ObjectNode legacy = JsonNodeFactory.instance.objectNode().put("text", "Legacy question");
    Question question = Question.builder().id(id).status(QuestionStatus.DRAFT)
        .createdBy(User.builder().id(owner).build()).contentJson(legacy).build();
    when(currentUserProvider.getCurrentUser())
        .thenReturn(CurrentUser.builder().id(owner).role(Role.LECTURER).build());
    when(questionRepository.findForUpdateById(id)).thenReturn(Optional.of(question));
    when(questionAssetRepository.findByQuestionIdOrderBySortOrderAsc(id))
        .thenReturn(List.of(QuestionAsset.builder().build()));
    ObjectNode manual = JsonNodeFactory.instance.objectNode().put("schemaVersion", 1);
    assertThatThrownBy(() -> service.update(id, new UpdateQuestionRequest(
        UUID.randomUUID(), UUID.randomUUID(), "written", manual, manual, null, null, 0L)))
        .isInstanceOf(ApiException.class)
        .hasMessageContaining("Legacy assets cannot be converted");
    assertThat(question.getContentJson()).isEqualTo(legacy);
    verify(questionRepository, never()).saveAndFlush(any());
  }

  @Test
  void studentCannotReadTheStaffBank() {
    when(currentUserProvider.getCurrentUser())
        .thenReturn(CurrentUser.builder().id(UUID.randomUUID()).role(Role.STUDENT).build());

    assertThatThrownBy(() -> service.get(UUID.randomUUID()))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.ACCESS_DENIED);
    verify(questionRepository, never()).findVisibleById(any(), any(), any());
  }

  @Test
  void manualUpdateRequiresExpectedVersionAndDoesNotUseLegacyValidator() {
    UUID id = UUID.randomUUID();
    UUID owner = UUID.randomUUID();
    ObjectNode content = JsonNodeFactory.instance.objectNode().put("schemaVersion", 1);
    Question question = Question.builder().id(id).status(QuestionStatus.DRAFT).contentJson(content).build();
    question.setCreatedBy(User.builder().id(owner).build());
    when(currentUserProvider.getCurrentUser())
        .thenReturn(CurrentUser.builder().id(owner).role(Role.LECTURER).build());
    when(questionRepository.findForUpdateById(id)).thenReturn(Optional.of(question));
    UpdateQuestionRequest request = new UpdateQuestionRequest(
        UUID.randomUUID(), UUID.randomUUID(), "written", content, content, null, null, null);

    assertThatThrownBy(() -> service.update(id, request))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.VALIDATION_ERROR);
    verify(validationService, never()).requireValid(any());
    verify(questionRepository, never()).saveAndFlush(any());
  }

  @Test
  void updateReturnsVersionAssignedByFlush() {
    UUID id = UUID.randomUUID();
    UUID owner = UUID.randomUUID();
    UUID subjectId = UUID.randomUUID();
    UUID topicId = UUID.randomUUID();
    Subject subject = Subject.builder().id(subjectId).enabled(true).build();
    Topic topic = Topic.builder().id(topicId).subject(subject).enabled(true).build();
    ObjectNode content = JsonNodeFactory.instance.objectNode()
        .put("schemaVersion", 1)
        .put("title", "")
        .put("structure", "SINGLE");
    content.putArray("stem").addObject().put("id", "s").put("kind", "text").put("source", "");
    content.putArray("parts");
    ObjectNode answer = JsonNodeFactory.instance.objectNode();
    answer.putArray("parts");
    Question question = Question.builder().id(id).status(QuestionStatus.DRAFT).contentJson(content).build();
    question.setCreatedBy(User.builder().id(owner).build());
    when(currentUserProvider.getCurrentUser())
        .thenReturn(CurrentUser.builder().id(owner).role(Role.LECTURER).build());
    when(questionRepository.findForUpdateById(id)).thenReturn(Optional.of(question));
    when(subjectRepository.findByIdAndEnabledTrue(subjectId)).thenReturn(Optional.of(subject));
    when(topicRepository.findById(topicId)).thenReturn(Optional.of(topic));
    when(questionFigureRepository.findByQuestionId(id)).thenReturn(List.of());
    when(questionAssetRepository.findByQuestionIdOrderBySortOrderAsc(id)).thenReturn(List.of());
    when(questionRepository.saveAndFlush(any())).thenAnswer(invocation -> {
      Question saved = invocation.getArgument(0);
      saved.setVersion(saved.getVersion() + 1);
      return saved;
    });
    when(questionMapper.toResponse(any(), eq(List.of()))).thenAnswer(invocation -> {
      Question saved = invocation.getArgument(0);
      return new QuestionResponse(
          saved.getId(), subjectId, "Math", topicId, "Algebra", saved.getStatus(), saved.getType(),
          saved.getContentJson(), saved.getAnswerJson(), saved.getExplanationJson(), null, null, null,
          List.of(), owner, saved.getVersion());
    });

    QuestionResponse response = service.update(
        id, new UpdateQuestionRequest(subjectId, topicId, "written", content, answer, null, null, 0L));

    assertThat(response.version()).isEqualTo(1L);
    verify(questionRepository).saveAndFlush(question);
  }
}
