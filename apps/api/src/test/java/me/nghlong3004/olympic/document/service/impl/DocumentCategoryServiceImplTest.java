package me.nghlong3004.olympic.document.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.document.entity.DocumentCategory;
import me.nghlong3004.olympic.document.mapper.CategoryMapper;
import me.nghlong3004.olympic.document.repository.DocumentCategoryRepository;
import me.nghlong3004.olympic.document.response.CategorySummaryResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DocumentCategoryServiceImplTest {

  @Mock private DocumentCategoryRepository categoryRepository;
  @Mock private CategoryMapper categoryMapper;

  @InjectMocks private DocumentCategoryServiceImpl documentCategoryService;

  @Test
  void getAllEnabledCategories_shouldReturnMappedList() {
    DocumentCategory category = new DocumentCategory();
    category.setId(UUID.randomUUID());
    category.setName("Science");
    category.setEnabled(true);
    
    CategorySummaryResponse response = new CategorySummaryResponse(category.getId(), "Science", "science");

    when(categoryRepository.findAllByEnabledTrueOrderByNameAsc()).thenReturn(List.of(category));
    when(categoryMapper.toSummaryResponse(category)).thenReturn(response);

    List<CategorySummaryResponse> result = documentCategoryService.getAllEnabledCategories();

    assertThat(result).hasSize(1);
    assertThat(result.get(0).name()).isEqualTo("Science");
  }
}
