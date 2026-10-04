package me.nghlong3004.olympic.exam.repository;

import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.exam.entity.ExamPaperFigure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Repository
public interface ExamPaperFigureRepository extends JpaRepository<ExamPaperFigure, UUID> {
  Optional<ExamPaperFigure> findByPaperIdAndAssetId(UUID paperId, UUID assetId);
}
