package me.nghlong3004.olympic.exam.repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.exam.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Repository
public interface ExamRepository extends JpaRepository<Exam, UUID> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select exam from Exam exam where exam.id = :id")
  Optional<Exam> findForUpdateById(@Param("id") UUID id);

  @Query("""
      select exam from Exam exam
      where exam.createdById = :ownerId
      order by exam.updatedAt desc, exam.id asc
      """)
  List<Exam> findOwned(@Param("ownerId") UUID ownerId);

  @Query("""
      select exam from Exam exam
      order by exam.updatedAt desc, exam.id asc
      """)
  List<Exam> findAllOrdered();
}
