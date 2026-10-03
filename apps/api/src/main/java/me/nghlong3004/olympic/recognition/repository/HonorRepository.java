package me.nghlong3004.olympic.recognition.repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.recognition.entity.Honor;
import me.nghlong3004.olympic.recognition.enums.HonorStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
@Repository
public interface HonorRepository extends JpaRepository<Honor, UUID> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select h from Honor h where h.id = :id")
  Optional<Honor> findForUpdateById(@Param("id") UUID id);

  @Lock(LockModeType.PESSIMISTIC_FORCE_INCREMENT)
  @Query("select h from Honor h where h.id = :id")
  Optional<Honor> findForPhotoUpdateById(@Param("id") UUID id);

  @Query("""
      select h from Honor h where (:admin = true or h.status = :published)
      and (:year is null or h.year = :year)
      and lower(h.subject) like lower(concat('%', :subject, '%'))
      """)
  Page<Honor> filter(@Param("admin") boolean admin, @Param("published") HonorStatus published,
      @Param("year") Integer year, @Param("subject") String subject, Pageable pageable);
}
