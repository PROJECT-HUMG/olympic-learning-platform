package me.nghlong3004.olympic.api.user.service;

import me.nghlong3004.olympic.api.user.dto.CreateUserRequest;
import me.nghlong3004.olympic.api.user.dto.UpdateUserRequest;
import me.nghlong3004.olympic.api.user.dto.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for user management operations.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
public interface UserService {

    Optional<UserResponse> findByPublicId(UUID publicId);

    UserResponse getByPublicId(UUID publicId);

    Page<UserResponse> findAll(Pageable pageable);

    Page<UserResponse> findByRole(String roleName, Pageable pageable);

    UserResponse create(CreateUserRequest request);

    UserResponse update(UUID publicId, UpdateUserRequest request);

    void changeRole(UUID publicId, UUID rolePublicId);

    void toggleStatus(UUID publicId);

    void softDelete(UUID publicId, Long deletedBy);
}
