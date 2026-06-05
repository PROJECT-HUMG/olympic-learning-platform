package me.nghlong3004.olympic.api.learning.service;

import me.nghlong3004.olympic.api.learning.dto.CreateSubjectRequest;
import me.nghlong3004.olympic.api.learning.dto.SubjectResponse;
import me.nghlong3004.olympic.api.learning.dto.UpdateSubjectRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Service interface for subject management.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
public interface SubjectService {

    SubjectResponse getByPublicId(UUID publicId);

    Page<SubjectResponse> findAll(Pageable pageable);

    Page<SubjectResponse> findAllActive(Pageable pageable);

    SubjectResponse create(CreateSubjectRequest request);

    SubjectResponse update(UUID publicId, UpdateSubjectRequest request);

    void toggleActive(UUID publicId);
}
