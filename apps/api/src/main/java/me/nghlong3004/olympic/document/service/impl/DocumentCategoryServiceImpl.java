package me.nghlong3004.olympic.document.service.impl;

import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.document.mapper.CategoryMapper;
import me.nghlong3004.olympic.document.repository.DocumentCategoryRepository;
import me.nghlong3004.olympic.document.response.CategorySummaryResponse;
import me.nghlong3004.olympic.document.service.DocumentCategoryService;
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

  @Override
  public List<CategorySummaryResponse> getAllEnabledCategories() {
    log.debug("Fetching all enabled document categories");
    return categoryRepository.findAllByEnabledTrueOrderByNameAsc().stream()
        .map(categoryMapper::toSummaryResponse)
        .toList();
  }
}
