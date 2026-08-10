package me.nghlong3004.olympic.topic.repository;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.topic.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;

/** @author nghlong3004 (Long Nguyen Hoang) @since 8/10/2026 */
public interface TopicRepository extends JpaRepository<Topic, UUID> {
  List<Topic> findAllBySubjectIdAndEnabledTrueOrderByNameAsc(UUID subjectId);
}
