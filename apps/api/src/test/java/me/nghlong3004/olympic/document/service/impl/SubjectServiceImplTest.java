package me.nghlong3004.olympic.document.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.document.entity.Subject;
import me.nghlong3004.olympic.document.mapper.SubjectMapper;
import me.nghlong3004.olympic.document.repository.SubjectRepository;
import me.nghlong3004.olympic.document.response.SubjectSummaryResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SubjectServiceImplTest {

  @Mock private SubjectRepository subjectRepository;
  @Mock private SubjectMapper subjectMapper;

  @InjectMocks private SubjectServiceImpl subjectService;

  @Test
  void getAllEnabledSubjects_shouldReturnMappedList() {
    Subject subject = new Subject();
    subject.setId(UUID.randomUUID());
    subject.setName("Math");
    subject.setEnabled(true);
    
    SubjectSummaryResponse response = new SubjectSummaryResponse(subject.getId(), "MATH", "Math", "math", "Description");

    when(subjectRepository.findAllByEnabledTrueOrderByNameAsc()).thenReturn(List.of(subject));
    when(subjectMapper.toSummaryResponse(subject)).thenReturn(response);

    List<SubjectSummaryResponse> result = subjectService.getAllEnabledSubjects();

    assertThat(result).hasSize(1);
    assertThat(result.get(0).name()).isEqualTo("Math");
  }
}
