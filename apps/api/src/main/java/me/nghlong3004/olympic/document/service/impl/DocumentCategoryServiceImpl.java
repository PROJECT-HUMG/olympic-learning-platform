package me.nghlong3004.olympic.document.service.impl;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.document.entity.DocumentCategory;
import me.nghlong3004.olympic.document.exception.CategoryNotFoundException;
import me.nghlong3004.olympic.document.mapper.CategoryMapper;
import me.nghlong3004.olympic.document.repository.DocumentCategoryRepository;
import me.nghlong3004.olympic.document.request.CreateDocumentCategoryRequest;
import me.nghlong3004.olympic.document.request.UpdateDocumentCategoryRequest;
import me.nghlong3004.olympic.document.response.CategorySummaryResponse;
import me.nghlong3004.olympic.document.service.DocumentCategoryService;
import me.nghlong3004.olympic.common.util.SlugGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DocumentCategoryServiceImpl implements DocumentCategoryService {

  private final DocumentCategoryRepository categoryRepository;
  private final CategoryMapper categoryMapper;
  private final SlugGenerator slugGenerator;

  @Override
  public List<CategorySummaryResponse> getAllEnabledCategories() {
    log.debug("Fetching all enabled document categories");
    return categoryRepository.findAllByEnabledTrueOrderByNameAsc().stream()
        .map(categoryMapper::toSummaryResponse)
        .toList();
  }

  @Override
  @Transactional
  public CategorySummaryResponse createCategory(CreateDocumentCategoryRequest request) {
    log.debug("Creating new category: {}", request.name());
    
    var category = DocumentCategory.builder()
        .code(request.code())
        .name(request.name())
        .slug(slugGenerator.generate(request.name()))
        .description(request.description())
        .enabled(true)
        .build();
        
    var saved = categoryRepository.save(category);
    return categoryMapper.toSummaryResponse(saved);
  }

  @Override
  @Transactional
  public CategorySummaryResponse updateCategory(UUID id, UpdateDocumentCategoryRequest request) {
    log.debug("Updating category {}: {}", id, request.name());
    
    var category = categoryRepository.findById(id)
        .orElseThrow(() -> new CategoryNotFoundException(id));
        
    category.setCode(request.code());
    category.setName(request.name());
    category.setSlug(slugGenerator.generate(request.name()));
    category.setDescription(request.description());
    category.setUpdatedAt(OffsetDateTime.now());
    
    var saved = categoryRepository.save(category);
    return categoryMapper.toSummaryResponse(saved);
  }

  @Override
  @Transactional
  public void deleteCategory(UUID id) {
    log.debug("Soft deleting category {}", id);
    
    var category = categoryRepository.findById(id)
        .orElseThrow(() -> new CategoryNotFoundException(id));
        
    category.setEnabled(false);
    category.setUpdatedAt(OffsetDateTime.now());
    categoryRepository.save(category);
  }
}
