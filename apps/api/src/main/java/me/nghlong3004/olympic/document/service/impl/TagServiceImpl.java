package me.nghlong3004.olympic.document.service.impl;

import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.document.mapper.TagMapper;
import me.nghlong3004.olympic.document.repository.TagRepository;
import me.nghlong3004.olympic.document.response.TagSummaryResponse;
import me.nghlong3004.olympic.document.service.TagService;
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
public class TagServiceImpl implements TagService {

  private final TagRepository tagRepository;
  private final TagMapper tagMapper;

  @Override
  public List<TagSummaryResponse> getAllEnabledTags() {
    log.debug("Fetching all enabled tags");
    return tagRepository.findAllByEnabledTrueOrderByNameAsc().stream()
        .map(tagMapper::toSummaryResponse)
        .toList();
  }
}
