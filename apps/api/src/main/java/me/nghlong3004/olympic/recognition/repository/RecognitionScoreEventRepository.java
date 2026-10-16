package me.nghlong3004.olympic.recognition.repository;

import me.nghlong3004.olympic.recognition.entity.RecognitionScoreEvent;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/16/2026
 */
public interface RecognitionScoreEventRepository
    extends JpaRepository<RecognitionScoreEvent, Long> {}
