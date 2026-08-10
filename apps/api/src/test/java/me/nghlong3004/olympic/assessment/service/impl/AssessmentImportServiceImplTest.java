package me.nghlong3004.olympic.assessment.service.impl;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import me.nghlong3004.olympic.assessment.properties.AssessmentImportProperties;
import me.nghlong3004.olympic.assessment.repository.AssessmentImportRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftAssetRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftRepository;
import me.nghlong3004.olympic.assessment.service.AssessmentImportQueue;
import me.nghlong3004.olympic.question.service.QuestionService;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.storage.mapper.FileMapper;
import me.nghlong3004.olympic.storage.repository.FileRepository;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.user.repository.UserRepository;
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
  @Mock private FileRepository fileRepository;
  @Mock private FileMapper fileMapper;
  @Mock private StorageService storageService;
  @Mock private AssessmentImportQueue queue;
  @Mock private CurrentUserProvider currentUserProvider;
  @Mock private UserRepository userRepository;
  @Mock private AssessmentImportProperties properties;
  @Mock private QuestionService questionService;

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
    var file = new MockMultipartFile("file", "questions.pdf", "application/pdf", new byte[2 * 1024 * 1024]);

    assertThatThrownBy(() -> service.create(file)).isInstanceOf(ApiException.class);
    verifyNoInteractions(storageService, queue);
  }
}
