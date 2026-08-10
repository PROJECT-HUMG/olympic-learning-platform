package me.nghlong3004.olympic.topic.service;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.topic.request.CreateTopicRequest;
import me.nghlong3004.olympic.topic.response.TopicResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public interface TopicService {
  /**
   * Lists enabled topics for a subject.
   *
   * @param subjectId subject identifier
   * @return enabled topics sorted by name
   */
  List<TopicResponse> getEnabledBySubject(UUID subjectId);

  /**
   * Creates a topic for an enabled subject. Administrator access is required.
   *
   * @param request validated topic payload
   * @return created topic
   */
  TopicResponse create(CreateTopicRequest request);

  /**
   * Disables a topic. Administrator access is required.
   *
   * @param id topic identifier
   */
  void disable(UUID id);
}
