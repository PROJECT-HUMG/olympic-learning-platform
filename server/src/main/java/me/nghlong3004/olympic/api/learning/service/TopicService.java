package me.nghlong3004.olympic.api.learning.service;

import me.nghlong3004.olympic.api.learning.dto.CreateTopicRequest;
import me.nghlong3004.olympic.api.learning.dto.TopicResponse;
import me.nghlong3004.olympic.api.learning.dto.UpdateTopicRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Service interface for topic management.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
public interface TopicService {

    TopicResponse getByPublicId(UUID publicId);

    Page<TopicResponse> findBySubject(UUID subjectPublicId, Pageable pageable);

    TopicResponse create(CreateTopicRequest request);

    TopicResponse update(UUID publicId, UpdateTopicRequest request);

    void toggleActive(UUID publicId);
}
