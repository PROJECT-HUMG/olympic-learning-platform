package me.nghlong3004.olympic.document.service.impl;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.document.entity.Tag;
import me.nghlong3004.olympic.document.exception.TagNotFoundException;
import me.nghlong3004.olympic.document.mapper.TagMapper;
import me.nghlong3004.olympic.document.repository.TagRepository;
import me.nghlong3004.olympic.document.request.CreateTagRequest;
import me.nghlong3004.olympic.document.request.UpdateTagRequest;
import me.nghlong3004.olympic.document.response.TagSummaryResponse;
import me.nghlong3004.olympic.document.service.SlugGenerator;
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
  private final SlugGenerator slugGenerator;

  @Override
  public List<TagSummaryResponse> getAllEnabledTags() {
    log.debug("Fetching all enabled tags");
    return tagRepository.findAllByEnabledTrueOrderByNameAsc().stream()
        .map(tagMapper::toSummaryResponse)
        .toList();
  }

  @Override
  @Transactional
  public TagSummaryResponse createTag(CreateTagRequest request) {
    log.debug("Creating new tag: {}", request.name());
    
    var tag = Tag.builder()
        .code(request.code())
        .name(request.name())
        .slug(slugGenerator.generate(request.name()))
        .enabled(true)
        .build();
        
    var saved = tagRepository.save(tag);
    return tagMapper.toSummaryResponse(saved);
  }

  @Override
  @Transactional
  public TagSummaryResponse updateTag(UUID id, UpdateTagRequest request) {
    log.debug("Updating tag {}: {}", id, request.name());
    
    var tag = tagRepository.findById(id)
        .orElseThrow(() -> new TagNotFoundException(id));
        
    tag.setCode(request.code());
    tag.setName(request.name());
    tag.setSlug(slugGenerator.generate(request.name()));
    tag.setUpdatedAt(OffsetDateTime.now());
    
    var saved = tagRepository.save(tag);
    return tagMapper.toSummaryResponse(saved);
  }

  @Override
  @Transactional
  public void deleteTag(UUID id) {
    log.debug("Soft deleting tag {}", id);
    
    var tag = tagRepository.findById(id)
        .orElseThrow(() -> new TagNotFoundException(id));
        
    tag.setEnabled(false);
    tag.setUpdatedAt(OffsetDateTime.now());
    tagRepository.save(tag);
  }
}
