package me.nghlong3004.olympic.topic.service;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.topic.response.TopicResponse;
import me.nghlong3004.olympic.topic.request.CreateTopicRequest;

/** @author nghlong3004 (Long Nguyen Hoang) @since 8/10/2026 */
public interface TopicService {
  List<TopicResponse> getEnabledBySubject(UUID subjectId);
  TopicResponse create(CreateTopicRequest request);
  void disable(UUID id);
}
