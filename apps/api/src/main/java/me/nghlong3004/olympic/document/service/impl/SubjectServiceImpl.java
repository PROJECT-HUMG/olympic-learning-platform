package me.nghlong3004.olympic.document.service.impl;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.document.entity.Subject;
import me.nghlong3004.olympic.document.exception.SubjectNotFoundException;
import me.nghlong3004.olympic.document.mapper.SubjectMapper;
import me.nghlong3004.olympic.document.repository.SubjectRepository;
import me.nghlong3004.olympic.document.request.CreateSubjectRequest;
import me.nghlong3004.olympic.document.request.UpdateSubjectRequest;
import me.nghlong3004.olympic.document.response.SubjectSummaryResponse;
import me.nghlong3004.olympic.common.util.SlugGenerator;
import me.nghlong3004.olympic.document.service.SubjectService;
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
public class SubjectServiceImpl implements SubjectService {

  private final SubjectRepository subjectRepository;
  private final SubjectMapper subjectMapper;
  private final SlugGenerator slugGenerator;

  @Override
  public List<SubjectSummaryResponse> getAllEnabledSubjects() {
    log.debug("Fetching all enabled subjects");
    return subjectRepository.findAllByEnabledTrueOrderByNameAsc().stream()
        .map(subjectMapper::toSummaryResponse)
        .toList();
  }

  @Override
  @Transactional
  public SubjectSummaryResponse createSubject(CreateSubjectRequest request) {
    log.debug("Creating new subject: {}", request.name());
    
    var subject = Subject.builder()
        .code(request.code())
        .name(request.name())
        .slug(slugGenerator.generate(request.name()))
        .description(request.description())
        .enabled(true)
        .build();
        
    var saved = subjectRepository.save(subject);
    return subjectMapper.toSummaryResponse(saved);
  }

  @Override
  @Transactional
  public SubjectSummaryResponse updateSubject(UUID id, UpdateSubjectRequest request) {
    log.debug("Updating subject {}: {}", id, request.name());
    
    var subject = subjectRepository.findById(id)
        .orElseThrow(() -> new SubjectNotFoundException(id));
        
    subject.setCode(request.code());
    subject.setName(request.name());
    subject.setSlug(slugGenerator.generate(request.name()));
    subject.setDescription(request.description());
    subject.setUpdatedAt(OffsetDateTime.now());
    
    var saved = subjectRepository.save(subject);
    return subjectMapper.toSummaryResponse(saved);
  }

  @Override
  @Transactional
  public void deleteSubject(UUID id) {
    log.debug("Soft deleting subject {}", id);
    
    var subject = subjectRepository.findById(id)
        .orElseThrow(() -> new SubjectNotFoundException(id));
        
    subject.setEnabled(false);
    subject.setUpdatedAt(OffsetDateTime.now());
    subjectRepository.save(subject);
  }
}
