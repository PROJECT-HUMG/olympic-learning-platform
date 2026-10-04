package me.nghlong3004.olympic.group.repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.group.entity.AccountabilityGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Repository
public interface AccountabilityGroupRepository extends JpaRepository<AccountabilityGroup, UUID> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select g from AccountabilityGroup g where g.id = :id")
  Optional<AccountabilityGroup> findForUpdateById(@Param("id") UUID id);
}
