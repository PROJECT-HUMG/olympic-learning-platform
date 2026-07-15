package me.nghlong3004.olympic.user.repository;

import java.util.UUID;
import me.nghlong3004.olympic.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/15/2026
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {}
