package me.nghlong3004.olympic.user.repository;

import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/15/2026
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
  Optional<User> findByEmailIgnoreCaseAndDeletedAtIsNull(String email);

  Optional<User> findByIdAndDeletedAtIsNull(UUID id);

  List<User> findByIdInAndDeletedAtIsNull(Collection<UUID> ids);

  boolean existsByEmailIgnoreCaseAndDeletedAtIsNull(String email);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query(
      """
				SELECT user
				FROM User user
				WHERE user.id = :userId
				AND user.deletedAt IS NULL
			""")
  Optional<User> findForUpdateById(@Param("userId") UUID userId);
}
