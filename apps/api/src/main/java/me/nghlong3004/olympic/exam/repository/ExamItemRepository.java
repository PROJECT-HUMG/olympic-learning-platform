package me.nghlong3004.olympic.exam.repository;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.exam.entity.ExamItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Repository
public interface ExamItemRepository extends JpaRepository<ExamItem, UUID> {
  List<ExamItem> findByExamIdOrderByPositionAsc(UUID examId);
}
