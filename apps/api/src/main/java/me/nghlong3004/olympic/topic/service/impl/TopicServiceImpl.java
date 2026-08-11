package me.nghlong3004.olympic.topic.service.impl;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.common.util.SlugGenerator;
import me.nghlong3004.olympic.document.repository.SubjectRepository;
import me.nghlong3004.olympic.topic.mapper.TopicMapper;
import me.nghlong3004.olympic.topic.repository.TopicRepository;
import me.nghlong3004.olympic.topic.request.CreateTopicRequest;
import me.nghlong3004.olympic.topic.response.TopicResponse;
import me.nghlong3004.olympic.topic.service.TopicService;
import me.nghlong3004.olympic.user.enums.Role;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TopicServiceImpl implements TopicService {
  private final TopicRepository topicRepository;
  private final SubjectRepository subjectRepository;
  private final CurrentUserProvider currentUserProvider;
  private final SlugGenerator slugGenerator;
  private final TopicMapper topicMapper;

  @Transactional(readOnly = true)
  @Override
  public List<TopicResponse> getEnabledBySubject(UUID subjectId) {
    return topicRepository.findAllBySubjectIdAndEnabledTrueOrderByNameAsc(subjectId).stream()
        .map(topicMapper::toResponse)
        .toList();
  }

  @Transactional
  @Override
  public TopicResponse create(CreateTopicRequest request) {
    requireAdmin();
    var subject =
        subjectRepository
            .findByIdAndEnabledTrue(request.subjectId())
            .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    var topic = topicMapper.toEntity(request);
    topic.setSubject(subject);
    topic.setName(request.name().trim());
    topic.setSlug(slugGenerator.generate(topic.getName()));
    topic.setEnabled(true);
    var saved = topicRepository.save(topic);
    log.info("Topic created: topicId={}, subjectId={}", saved.getId(), subject.getId());
    return topicMapper.toResponse(saved);
  }

  @Transactional
  @Override
  public void disable(UUID id) {
    requireAdmin();
    var topic =
        topicRepository.findById(id).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    topic.setEnabled(false);
    log.info("Topic disabled: topicId={}", id);
  }

  private void requireAdmin() {
    var user = currentUserProvider.getCurrentUser();
    if (user.role() != Role.ADMIN) {
      throw ErrorCode.ACCESS_DENIED.throwIt();
    }
  }
}
