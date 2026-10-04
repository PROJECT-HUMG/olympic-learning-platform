package me.nghlong3004.olympic.group.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.group.entity.AccountabilityGroupShareViewer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Repository
public interface AccountabilityGroupShareViewerRepository
    extends JpaRepository<AccountabilityGroupShareViewer, UUID> {
  List<AccountabilityGroupShareViewer> findByGroup_Id(UUID groupId);

  Optional<AccountabilityGroupShareViewer> findByOwner_IdAndGroup_IdAndViewer_Id(
      UUID ownerId, UUID groupId, UUID viewerId);

  List<AccountabilityGroupShareViewer> findByOwner_IdAndGroup_IdAndActiveTrue(
      UUID ownerId, UUID groupId);
}
