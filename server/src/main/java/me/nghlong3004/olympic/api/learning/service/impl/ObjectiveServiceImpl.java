package me.nghlong3004.olympic.api.learning.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.api.common.exception.DuplicateResourceException;
import me.nghlong3004.olympic.api.common.exception.ResourceNotFoundException;
import me.nghlong3004.olympic.api.learning.dto.CreateObjectiveRequest;
import me.nghlong3004.olympic.api.learning.dto.ObjectiveResponse;
import me.nghlong3004.olympic.api.learning.dto.UpdateObjectiveRequest;
import me.nghlong3004.olympic.api.learning.entity.LearningObjective;
import me.nghlong3004.olympic.api.learning.mapper.ObjectiveMapper;
import me.nghlong3004.olympic.api.learning.repository.LearningObjectiveRepository;
import me.nghlong3004.olympic.api.learning.repository.TopicRepository;
import me.nghlong3004.olympic.api.learning.service.ObjectiveService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * Implementation of {@link ObjectiveService}.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ObjectiveServiceImpl implements ObjectiveService {

    private final LearningObjectiveRepository objectiveRepository;
    private final TopicRepository topicRepository;
    private final ObjectiveMapper objectiveMapper;

    @Override
    public ObjectiveResponse getByPublicId(UUID publicId) {
        log.debug("Looking up objective by publicId={}", publicId);
        return objectiveRepository.findByPublicId(publicId)
                .map(objectiveMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("LearningObjective", publicId));
    }

    @Override
    public List<ObjectiveResponse> findByTopic(UUID topicPublicId) {
        log.debug("Listing objectives by topicId={}", topicPublicId);
        var topic = topicRepository.findByPublicId(topicPublicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic", topicPublicId));
        return objectiveRepository.findByTopicId(topic.getId()).stream()
                .map(objectiveMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ObjectiveResponse create(CreateObjectiveRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        log.debug("Creating objective with code={}", request.code());

        if (objectiveRepository.existsByCode(request.code())) {
            log.warn("Objective creation failed: duplicate code={}", request.code());
            throw new DuplicateResourceException("LearningObjective", "code", request.code());
        }

        var topic = topicRepository.findByPublicId(request.topicId())
                .orElseThrow(() -> new ResourceNotFoundException("Topic", request.topicId()));

        var objective = LearningObjective.builder()
                .topic(topic)
                .code(request.code())
                .description(request.description())
                .bloomLevel(request.bloomLevel())
                .build();

        objective = objectiveRepository.save(objective);
        log.info("Objective created: objectiveId={}, code={}", objective.getPublicId(), objective.getCode());
        return objectiveMapper.toResponse(objective);
    }

    @Override
    @Transactional
    public ObjectiveResponse update(UUID publicId, UpdateObjectiveRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        log.debug("Updating objective: objectiveId={}", publicId);

        var objective = objectiveRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("LearningObjective", publicId));

        if (request.description() != null) objective.setDescription(request.description());
        if (request.bloomLevel() != null) objective.setBloomLevel(request.bloomLevel());

        objective = objectiveRepository.save(objective);
        log.info("Objective updated: objectiveId={}", publicId);
        return objectiveMapper.toResponse(objective);
    }

    @Override
    @Transactional
    public void delete(UUID publicId) {
        log.debug("Deleting objective: objectiveId={}", publicId);
        var objective = objectiveRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("LearningObjective", publicId));
        objectiveRepository.delete(objective);
        log.info("Objective deleted: objectiveId={}", publicId);
    }
}
