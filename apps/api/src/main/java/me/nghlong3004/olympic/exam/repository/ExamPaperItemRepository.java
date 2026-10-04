package me.nghlong3004.olympic.exam.repository;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.exam.entity.ExamPaperItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Repository
public interface ExamPaperItemRepository extends JpaRepository<ExamPaperItem, UUID> {
  List<ExamPaperItem> findByPaperIdOrderByPositionAsc(UUID paperId);
}
