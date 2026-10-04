package me.nghlong3004.olympic.exam.repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.exam.entity.ExamPaper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Repository
public interface ExamPaperRepository extends JpaRepository<ExamPaper, UUID> {
  @Query("""
      select paper from ExamPaper paper
      order by paper.releaseAt desc, paper.versionNumber desc, paper.id asc
      """)
  List<ExamPaper> findAllOrdered();

  @Query("""
      select paper from ExamPaper paper
      where paper.releaseAt <= :now
      order by paper.releaseAt desc, paper.versionNumber desc, paper.id asc
      """)
  List<ExamPaper> findReleased(@Param("now") OffsetDateTime now);
}
