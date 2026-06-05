package me.nghlong3004.olympic.api.user.service;

import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.api.common.exception.DuplicateResourceException;
import me.nghlong3004.olympic.api.common.exception.ResourceNotFoundException;
import me.nghlong3004.olympic.api.user.dto.CreateUserRequest;
import me.nghlong3004.olympic.api.user.dto.UpdateUserRequest;
import me.nghlong3004.olympic.api.user.dto.UserResponse;
import me.nghlong3004.olympic.api.user.entity.User;
import me.nghlong3004.olympic.api.user.mapper.UserMapper;
import me.nghlong3004.olympic.api.user.repository.RoleRepository;
import me.nghlong3004.olympic.api.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Service implementation for user management operations.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public Optional<UserResponse> findByPublicId(UUID publicId) {
        return userRepository.findByPublicId(publicId)
                .map(userMapper::toResponse);
    }

    public UserResponse getByPublicId(UUID publicId) {
        return findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("User", publicId));
    }

    public Page<UserResponse> findAll(Pageable pageable) {
        return userRepository.findAllActive(pageable)
                .map(userMapper::toResponse);
    }

    public Page<UserResponse> findByRole(String roleName, Pageable pageable) {
        return userRepository.findByRoleName(roleName, pageable)
                .map(userMapper::toResponse);
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        Objects.requireNonNull(request, "request must not be null");

        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("User", "email", request.email());
        }

        var role = roleRepository.findByPublicId(request.roleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role", request.roleId()));

        var user = User.of(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.fullName(),
                role
        );
        user.setPhone(request.phone());
        user.setStudentCode(request.studentCode());

        user = userRepository.save(user);
        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse update(UUID publicId, UpdateUserRequest request) {
        Objects.requireNonNull(request, "request must not be null");

        var user = userRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("User", publicId));

        if (request.email() != null && !request.email().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                throw new DuplicateResourceException("User", "email", request.email());
            }
            user.setEmail(request.email());
        }
        if (request.fullName() != null) user.setFullName(request.fullName());
        if (request.phone() != null) user.setPhone(request.phone());
        if (request.avatarUrl() != null) user.setAvatarUrl(request.avatarUrl());
        if (request.studentCode() != null) user.setStudentCode(request.studentCode());

        user = userRepository.save(user);
        return userMapper.toResponse(user);
    }

    @Transactional
    public void changeRole(UUID publicId, UUID rolePublicId) {
        var user = userRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("User", publicId));
        var role = roleRepository.findByPublicId(rolePublicId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", rolePublicId));
        user.setRole(role);
        userRepository.save(user);
    }

    @Transactional
    public void toggleStatus(UUID publicId) {
        var user = userRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("User", publicId));
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
    }

    @Transactional
    public void softDelete(UUID publicId, Long deletedBy) {
        var user = userRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("User", publicId));
        user.softDelete(deletedBy);
        userRepository.save(user);
    }
}
