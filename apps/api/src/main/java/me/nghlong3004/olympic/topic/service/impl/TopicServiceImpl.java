package me.nghlong3004.olympic.topic.service.impl;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.topic.repository.TopicRepository;
import me.nghlong3004.olympic.topic.entity.Topic;
import me.nghlong3004.olympic.topic.request.CreateTopicRequest;
import me.nghlong3004.olympic.topic.response.TopicResponse;
import me.nghlong3004.olympic.topic.service.TopicService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.common.util.SlugGenerator;
import me.nghlong3004.olympic.document.repository.SubjectRepository;
import me.nghlong3004.olympic.user.enums.Role;

/** @author nghlong3004 (Long Nguyen Hoang) @since 8/10/2026 */
@Service
@RequiredArgsConstructor
public class TopicServiceImpl implements TopicService {
  private final TopicRepository topicRepository;
  private final SubjectRepository subjectRepository;
  private final CurrentUserProvider currentUserProvider;
  private final SlugGenerator slugGenerator;

  @Override
  public List<TopicResponse> getEnabledBySubject(UUID subjectId) {
    return topicRepository.findAllBySubjectIdAndEnabledTrueOrderByNameAsc(subjectId).stream()
        .map(topic -> new TopicResponse(topic.getId(), topic.getSubject().getId(), topic.getName(), topic.getSlug()))
        .toList();
  }

  @Override
  @Transactional
  public TopicResponse create(CreateTopicRequest request) {
    requireAdmin();
    var subject = subjectRepository.findByIdAndEnabledTrue(request.subjectId()).orElseThrow(() -> ErrorCode.RESOURCE_NOT_FOUND.throwIt());
    var topic = topicRepository.save(Topic.builder().subject(subject).name(request.name().trim()).slug(slugGenerator.generate(request.name())).build());
    return new TopicResponse(topic.getId(), subject.getId(), topic.getName(), topic.getSlug());
  }

  @Override
  @Transactional
  public void disable(UUID id) { requireAdmin(); topicRepository.findById(id).orElseThrow(() -> ErrorCode.RESOURCE_NOT_FOUND.throwIt()).setEnabled(false); }

  private void requireAdmin() { var user = currentUserProvider.getCurrentUser(); if (user.role() != Role.ADMIN) throw ErrorCode.ACCESS_DENIED.throwIt(); }
}
