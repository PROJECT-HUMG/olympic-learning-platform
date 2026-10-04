package me.nghlong3004.olympic.group.repository;

import java.util.UUID;
import me.nghlong3004.olympic.group.entity.GroupAvatar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Repository
public interface GroupAvatarRepository extends JpaRepository<GroupAvatar, UUID> {}
