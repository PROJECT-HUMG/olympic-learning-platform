package me.nghlong3004.olympic.storage.repository;

import java.util.UUID;
import me.nghlong3004.olympic.storage.entity.FileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/23/2026
 */
@Repository
public interface FileRepository extends JpaRepository<FileEntity, UUID> {}
