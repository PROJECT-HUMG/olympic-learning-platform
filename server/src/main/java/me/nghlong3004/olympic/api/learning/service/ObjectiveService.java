package me.nghlong3004.olympic.api.learning.service;

import me.nghlong3004.olympic.api.learning.dto.CreateObjectiveRequest;
import me.nghlong3004.olympic.api.learning.dto.ObjectiveResponse;
import me.nghlong3004.olympic.api.learning.dto.UpdateObjectiveRequest;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for learning objective management.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
public interface ObjectiveService {

    ObjectiveResponse getByPublicId(UUID publicId);

    List<ObjectiveResponse> findByTopic(UUID topicPublicId);

    ObjectiveResponse create(CreateObjectiveRequest request);

    ObjectiveResponse update(UUID publicId, UpdateObjectiveRequest request);

    void delete(UUID publicId);
}
