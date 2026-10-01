package me.nghlong3004.olympic.studyroom.repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.studyroom.entity.StudyRoom;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/01/2026
 */
@Repository
public interface StudyRoomRepository extends JpaRepository<StudyRoom, UUID> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select room from StudyRoom room where room.id = :id")
  Optional<StudyRoom> findForUpdateById(@Param("id") UUID id);

  @EntityGraph(attributePaths = "owner")
  List<StudyRoom> findFirst50ByClosedFalseOrderByCreatedAtDesc();

  long countByOwnerIdAndClosedFalse(UUID ownerId);
}
