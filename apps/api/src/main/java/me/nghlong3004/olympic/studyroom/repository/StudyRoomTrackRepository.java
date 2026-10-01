package me.nghlong3004.olympic.studyroom.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.studyroom.entity.StudyRoomTrack;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/01/2026
 */
@Repository
public interface StudyRoomTrackRepository extends JpaRepository<StudyRoomTrack, UUID> {
  @EntityGraph(attributePaths = "requestedBy")
  List<StudyRoomTrack> findAllByRoomIdOrderByCreatedAtAscIdAsc(UUID roomId);

  Optional<StudyRoomTrack> findByIdAndRoomId(UUID id, UUID roomId);
}
