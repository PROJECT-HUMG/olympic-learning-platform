package me.nghlong3004.olympic.studyroom.repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.studyroom.entity.StudyRoomMember;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/01/2026
 */
@Repository
public interface StudyRoomMemberRepository extends JpaRepository<StudyRoomMember, UUID> {
  Optional<StudyRoomMember> findByRoomIdAndUserId(UUID roomId, UUID userId);

  @Query("select member.room.id from StudyRoomMember member where member.user.id = :userId and member.joined = true")
  Optional<UUID> findJoinedRoomIdByUserId(@Param("userId") UUID userId);

  @EntityGraph(attributePaths = {"user", "user.avatar"})
  List<StudyRoomMember> findAllByRoomIdAndJoinedTrueOrderByJoinedAtAsc(UUID roomId);

  long countByRoomIdAndJoinedTrueAndLastSeenGreaterThanEqual(UUID roomId, OffsetDateTime threshold);
}
