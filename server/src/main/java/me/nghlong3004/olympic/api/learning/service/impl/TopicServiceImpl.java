package me.nghlong3004.olympic.api.learning.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.api.common.exception.ResourceNotFoundException;
import me.nghlong3004.olympic.api.learning.dto.CreateTopicRequest;
import me.nghlong3004.olympic.api.learning.dto.TopicResponse;
import me.nghlong3004.olympic.api.learning.dto.UpdateTopicRequest;
import me.nghlong3004.olympic.api.learning.entity.Topic;
import me.nghlong3004.olympic.api.learning.mapper.TopicMapper;
import me.nghlong3004.olympic.api.learning.repository.SubjectRepository;
import me.nghlong3004.olympic.api.learning.repository.TopicRepository;
import me.nghlong3004.olympic.api.learning.service.TopicService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.UUID;

/**
 * Implementation of {@link TopicService}.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class TopicServiceImpl implements TopicService {

    private final TopicRepository topicRepository;
    private final SubjectRepository subjectRepository;
    private final TopicMapper topicMapper;

    @Override
    public TopicResponse getByPublicId(UUID publicId) {
        log.debug("Looking up topic by publicId={}", publicId);
        return topicRepository.findByPublicId(publicId)
                .map(topicMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Topic", publicId));
    }

    @Override
    public Page<TopicResponse> findBySubject(UUID subjectPublicId, Pageable pageable) {
        log.debug("Listing topics by subjectId={}, page={}, size={}",
                subjectPublicId, pageable.getPageNumber(), pageable.getPageSize());
        return topicRepository.findBySubjectPublicId(subjectPublicId, pageable)
                .map(topicMapper::toResponse);
    }

    @Override
    @Transactional
    public TopicResponse create(CreateTopicRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        log.debug("Creating topic for subjectId={}", request.subjectId());

        var subject = subjectRepository.findByPublicId(request.subjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject", request.subjectId()));

        Topic parent = null;
        if (request.parentId() != null) {
            parent = topicRepository.findByPublicId(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Topic (parent)", request.parentId()));
        }

        var topic = Topic.builder()
                .subject(subject)
                .parent(parent)
                .name(request.name())
                .description(request.description())
                .build();

        topic = topicRepository.save(topic);
        log.info("Topic created: topicId={}, subjectId={}", topic.getPublicId(), subject.getPublicId());
        return topicMapper.toResponse(topic);
    }

    @Override
    @Transactional
    public TopicResponse update(UUID publicId, UpdateTopicRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        log.debug("Updating topic: topicId={}", publicId);

        var topic = topicRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic", publicId));

        if (request.name() != null) topic.setName(request.name());
        if (request.description() != null) topic.setDescription(request.description());
        if (request.displayOrder() != null) topic.setDisplayOrder(request.displayOrder());

        topic = topicRepository.save(topic);
        log.info("Topic updated: topicId={}", publicId);
        return topicMapper.toResponse(topic);
    }

    @Override
    @Transactional
    public void toggleActive(UUID publicId) {
        var topic = topicRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic", publicId));
        boolean newStatus = !topic.isActive();
        topic.setActive(newStatus);
        topicRepository.save(topic);
        log.info("Topic status toggled: topicId={}, active={}", publicId, newStatus);
    }
}
