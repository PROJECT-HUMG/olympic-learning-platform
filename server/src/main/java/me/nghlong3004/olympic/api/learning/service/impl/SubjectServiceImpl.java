package me.nghlong3004.olympic.api.learning.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.api.common.exception.DuplicateResourceException;
import me.nghlong3004.olympic.api.common.exception.ResourceNotFoundException;
import me.nghlong3004.olympic.api.learning.dto.CreateSubjectRequest;
import me.nghlong3004.olympic.api.learning.dto.SubjectResponse;
import me.nghlong3004.olympic.api.learning.dto.UpdateSubjectRequest;
import me.nghlong3004.olympic.api.learning.entity.Subject;
import me.nghlong3004.olympic.api.learning.mapper.SubjectMapper;
import me.nghlong3004.olympic.api.learning.repository.SubjectRepository;
import me.nghlong3004.olympic.api.learning.service.SubjectService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.UUID;

/**
 * Implementation of {@link SubjectService}.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;
    private final SubjectMapper subjectMapper;

    @Override
    public SubjectResponse getByPublicId(UUID publicId) {
        log.debug("Looking up subject by publicId={}", publicId);
        return subjectRepository.findByPublicId(publicId)
                .map(subjectMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Subject", publicId));
    }

    @Override
    public Page<SubjectResponse> findAll(Pageable pageable) {
        log.debug("Listing all subjects: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        return subjectRepository.findAllOrdered(pageable)
                .map(subjectMapper::toResponse);
    }

    @Override
    public Page<SubjectResponse> findAllActive(Pageable pageable) {
        log.debug("Listing active subjects: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        return subjectRepository.findByActiveTrue(pageable)
                .map(subjectMapper::toResponse);
    }

    @Override
    @Transactional
    public SubjectResponse create(CreateSubjectRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        log.debug("Creating subject with code={}", request.code());

        if (subjectRepository.existsByCode(request.code())) {
            log.warn("Subject creation failed: duplicate code={}", request.code());
            throw new DuplicateResourceException("Subject", "code", request.code());
        }
        if (subjectRepository.existsByName(request.name())) {
            log.warn("Subject creation failed: duplicate name detected");
            throw new DuplicateResourceException("Subject", "name", request.name());
        }

        var subject = Subject.builder()
                .name(request.name())
                .code(request.code())
                .description(request.description())
                .iconUrl(request.iconUrl())
                .build();

        subject = subjectRepository.save(subject);
        log.info("Subject created: subjectId={}, code={}", subject.getPublicId(), subject.getCode());
        return subjectMapper.toResponse(subject);
    }

    @Override
    @Transactional
    public SubjectResponse update(UUID publicId, UpdateSubjectRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        log.debug("Updating subject: subjectId={}", publicId);

        var subject = subjectRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject", publicId));

        if (request.name() != null) subject.setName(request.name());
        if (request.description() != null) subject.setDescription(request.description());
        if (request.iconUrl() != null) subject.setIconUrl(request.iconUrl());
        if (request.displayOrder() != null) subject.setDisplayOrder(request.displayOrder());

        subject = subjectRepository.save(subject);
        log.info("Subject updated: subjectId={}", publicId);
        return subjectMapper.toResponse(subject);
    }

    @Override
    @Transactional
    public void toggleActive(UUID publicId) {
        var subject = subjectRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject", publicId));
        boolean newStatus = !subject.isActive();
        subject.setActive(newStatus);
        subjectRepository.save(subject);
        log.info("Subject status toggled: subjectId={}, active={}", publicId, newStatus);
    }
}
