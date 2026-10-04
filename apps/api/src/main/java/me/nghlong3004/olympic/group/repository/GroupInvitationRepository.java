package me.nghlong3004.olympic.group.repository;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.group.entity.GroupInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Repository
public interface GroupInvitationRepository extends JpaRepository<GroupInvitation, UUID> {
  boolean existsByGroupIdAndTargetUserIdAndStatus(UUID groupId, UUID targetUserId, String status);

  List<GroupInvitation> findByTargetUserIdAndStatusOrderByCreatedAtAsc(
      UUID targetUserId, String status);
}
