package me.nghlong3004.olympic.auth.repository;

import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.auth.entity.AuthRegistrationChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
@Repository
public interface AuthRegistrationChallengeRepository extends JpaRepository<AuthRegistrationChallenge, UUID> {
  Optional<AuthRegistrationChallenge> findByUserId(UUID userId);
  @Query("select c.userId from AuthRegistrationChallenge c where c.sessionHash = :hash")
  Optional<UUID> findUserIdBySessionHash(@Param("hash") String hash);
}
