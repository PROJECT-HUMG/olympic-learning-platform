package me.nghlong3004.olympic.recognition.repository;

import java.util.UUID;
import me.nghlong3004.olympic.recognition.entity.RecognitionPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
@Repository
public interface RecognitionPreferenceRepository extends JpaRepository<RecognitionPreference, UUID> {}
