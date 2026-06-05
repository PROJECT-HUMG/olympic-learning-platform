package me.nghlong3004.olympic.api.user.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.api.common.exception.DuplicateResourceException;
import me.nghlong3004.olympic.api.common.exception.ResourceNotFoundException;
import me.nghlong3004.olympic.api.user.dto.CreateUserRequest;
import me.nghlong3004.olympic.api.user.dto.UpdateUserRequest;
import me.nghlong3004.olympic.api.user.dto.UserResponse;
import me.nghlong3004.olympic.api.user.entity.User;
import me.nghlong3004.olympic.api.user.mapper.UserMapper;
import me.nghlong3004.olympic.api.user.repository.RoleRepository;
import me.nghlong3004.olympic.api.user.repository.UserRepository;
import me.nghlong3004.olympic.api.user.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of {@link UserService}.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public Optional<UserResponse> findByPublicId(UUID publicId) {
        log.debug("Looking up user by publicId={}", publicId);
        return userRepository.findByPublicId(publicId)
                .map(userMapper::toResponse);
    }

    @Override
    public UserResponse getByPublicId(UUID publicId) {
        return findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("User", publicId));
    }

    @Override
    public Page<UserResponse> findAll(Pageable pageable) {
        log.debug("Listing all active users: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        return userRepository.findAllActive(pageable)
                .map(userMapper::toResponse);
    }

    @Override
    public Page<UserResponse> findByRole(String roleName, Pageable pageable) {
        log.debug("Listing users by role={}, page={}, size={}", roleName, pageable.getPageNumber(), pageable.getPageSize());
        return userRepository.findByRoleName(roleName, pageable)
                .map(userMapper::toResponse);
    }

    @Override
    @Transactional
    public UserResponse create(CreateUserRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        log.debug("Creating user with email={}", request.email());

        if (userRepository.existsByEmail(request.email())) {
            log.warn("User creation failed: duplicate email={}", request.email());
            throw new DuplicateResourceException("User", "email", request.email());
        }

        var role = roleRepository.findByPublicId(request.roleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role", request.roleId()));

        var user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .phone(request.phone())
                .studentCode(request.studentCode())
                .role(role)
                .build();

        user = userRepository.save(user);
        log.info("User created: userId={}, email={}, role={}", user.getPublicId(), user.getEmail(), role.getName());
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse update(UUID publicId, UpdateUserRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        log.debug("Updating user: userId={}", publicId);

        var user = userRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("User", publicId));

        if (request.email() != null && !request.email().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                log.warn("User update failed: duplicate email={} for userId={}", request.email(), publicId);
                throw new DuplicateResourceException("User", "email", request.email());
            }
            user.setEmail(request.email());
        }
        if (request.fullName() != null) user.setFullName(request.fullName());
        if (request.phone() != null) user.setPhone(request.phone());
        if (request.avatarUrl() != null) user.setAvatarUrl(request.avatarUrl());
        if (request.studentCode() != null) user.setStudentCode(request.studentCode());

        user = userRepository.save(user);
        log.info("User updated: userId={}", publicId);
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public void changeRole(UUID publicId, UUID rolePublicId) {
        log.debug("Changing role for userId={} to roleId={}", publicId, rolePublicId);

        var user = userRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("User", publicId));
        var oldRole = user.getRole().getName();
        var role = roleRepository.findByPublicId(rolePublicId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", rolePublicId));
        user.setRole(role);
        userRepository.save(user);

        log.info("User role changed: userId={}, from={}, to={}", publicId, oldRole, role.getName());
    }

    @Override
    @Transactional
    public void toggleStatus(UUID publicId) {
        var user = userRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("User", publicId));
        boolean newStatus = !user.isEnabled();
        user.setEnabled(newStatus);
        userRepository.save(user);

        log.info("User status toggled: userId={}, enabled={}", publicId, newStatus);
    }

    @Override
    @Transactional
    public void softDelete(UUID publicId, Long deletedBy) {
        log.debug("Soft-deleting user: userId={}, deletedBy={}", publicId, deletedBy);

        var user = userRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("User", publicId));
        user.softDelete(deletedBy);
        userRepository.save(user);

        log.info("User soft-deleted: userId={}", publicId);
    }
}
