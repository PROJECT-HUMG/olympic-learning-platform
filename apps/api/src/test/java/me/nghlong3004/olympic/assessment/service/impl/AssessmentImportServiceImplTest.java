package me.nghlong3004.olympic.assessment.service.impl;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.assessment.entity.AssessmentImport;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportStatus;
import me.nghlong3004.olympic.assessment.properties.AssessmentImportProperties;
import me.nghlong3004.olympic.assessment.mapper.AssessmentImportMapper;
import me.nghlong3004.olympic.assessment.repository.AssessmentImportRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentImportPageRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftAssetRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftRepository;
import me.nghlong3004.olympic.assessment.service.AssessmentImportQueue;
import me.nghlong3004.olympic.assessment.service.AssessmentPublicationService;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.storage.mapper.FileMapper;
import me.nghlong3004.olympic.storage.repository.FileRepository;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.user.repository.UserRepository;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.enums.Role;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@ExtendWith(MockitoExtension.class)
class AssessmentImportServiceImplTest {

  @Mock private AssessmentImportRepository importRepository;
  @Mock private AssessmentQuestionDraftRepository draftRepository;
  @Mock private AssessmentQuestionDraftAssetRepository assetRepository;
  @Mock private AssessmentImportPageRepository pageRepository;
  @Mock private FileRepository fileRepository;
  @Mock private FileMapper fileMapper;
  @Mock private AssessmentImportMapper assessmentImportMapper;
  @Mock private StorageService storageService;
  @Mock private AssessmentImportQueue queue;
  @Mock private CurrentUserProvider currentUserProvider;
  @Mock private UserRepository userRepository;
  @Mock private AssessmentImportProperties properties;
  @Mock private AssessmentPublicationService assessmentPublicationService;

  @InjectMocks private AssessmentImportServiceImpl service;

  @Test
  void rejectsNonPdfBeforeCallingStorage() {
    when(properties.maxFileSizeMb()).thenReturn(25);
    var file = new MockMultipartFile("file", "questions.txt", "text/plain", "not-a-pdf".getBytes());

    assertThatThrownBy(() -> service.create(file))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.FILE_TYPE_NOT_ALLOWED);
    verifyNoInteractions(storageService, queue);
  }

  @Test
  void rejectsOversizedUploadBeforeCallingStorage() {
    when(properties.maxFileSizeMb()).thenReturn(1);
    var file =
        new MockMultipartFile(
            "file", "questions.pdf", "application/pdf", new byte[2 * 1024 * 1024]);

    assertThatThrownBy(() -> service.create(file)).isInstanceOf(ApiException.class);
    verifyNoInteractions(storageService, queue);
  }

  @Test
  void rejectsDraftMutationAfterPublication() {
    var importId = UUID.randomUUID();
    var userId = UUID.randomUUID();
    var assessmentImport =
        AssessmentImport.builder()
            .id(importId)
            .createdBy(User.builder().id(userId).build())
            .status(AssessmentImportStatus.PUBLISHED)
            .build();
    when(currentUserProvider.getCurrentUser())
        .thenReturn(CurrentUser.builder().id(userId).role(Role.LECTURER).build());
    when(importRepository.findForUpdateById(importId)).thenReturn(Optional.of(assessmentImport));

    assertThatThrownBy(() -> service.approveAll(importId))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.RESOURCE_STATE_CONFLICT);
    verifyNoInteractions(draftRepository);
  }
}
