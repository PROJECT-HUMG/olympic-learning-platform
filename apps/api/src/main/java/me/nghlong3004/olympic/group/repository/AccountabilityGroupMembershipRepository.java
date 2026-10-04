package me.nghlong3004.olympic.group.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.group.entity.AccountabilityGroupMembership;
import me.nghlong3004.olympic.group.enums.MembershipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Repository
public interface AccountabilityGroupMembershipRepository
    extends JpaRepository<AccountabilityGroupMembership, UUID> {

  Optional<AccountabilityGroupMembership> findByGroup_IdAndUser_Id(UUID groupId, UUID userId);

  boolean existsByGroup_IdAndUser_Id(UUID groupId, UUID userId);

  List<AccountabilityGroupMembership> findByGroup_IdAndStatus(
      UUID groupId, MembershipStatus status);

  List<AccountabilityGroupMembership> findByUser_IdAndStatus(UUID userId, MembershipStatus status);
}
