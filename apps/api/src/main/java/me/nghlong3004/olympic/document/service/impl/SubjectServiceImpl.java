package me.nghlong3004.olympic.document.service.impl;

import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.document.mapper.SubjectMapper;
import me.nghlong3004.olympic.document.repository.SubjectRepository;
import me.nghlong3004.olympic.document.response.SubjectSummaryResponse;
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

  @Override
  public List<SubjectSummaryResponse> getAllEnabledSubjects() {
    log.debug("Fetching all enabled subjects");
    return subjectRepository.findAllByEnabledTrueOrderByNameAsc().stream()
        .map(subjectMapper::toSummaryResponse)
        .toList();
  }
}
