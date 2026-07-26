package me.nghlong3004.olympic.document.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.document.entity.Tag;
import me.nghlong3004.olympic.document.mapper.TagMapper;
import me.nghlong3004.olympic.document.repository.TagRepository;
import me.nghlong3004.olympic.document.response.TagSummaryResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TagServiceImplTest {

  @Mock private TagRepository tagRepository;
  @Mock private TagMapper tagMapper;

  @InjectMocks private TagServiceImpl tagService;

  @Test
  void getAllEnabledTags_shouldReturnMappedList() {
    Tag tag = new Tag();
    tag.setId(UUID.randomUUID());
    tag.setName("Exam");
    tag.setEnabled(true);
    
    TagSummaryResponse response = new TagSummaryResponse(tag.getId(), "Exam", "exam");

    when(tagRepository.findAllByEnabledTrueOrderByNameAsc()).thenReturn(List.of(tag));
    when(tagMapper.toSummaryResponse(tag)).thenReturn(response);

    List<TagSummaryResponse> result = tagService.getAllEnabledTags();

    assertThat(result).hasSize(1);
    assertThat(result.get(0).name()).isEqualTo("Exam");
  }
}
