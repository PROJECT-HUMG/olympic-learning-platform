package me.nghlong3004.olympic.api.user.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.api.user.dto.CreateUserRequest;
import me.nghlong3004.olympic.api.user.dto.UpdateUserRequest;
import me.nghlong3004.olympic.api.user.dto.UserResponse;
import me.nghlong3004.olympic.api.user.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.UUID;

/**
 * REST controller for user management operations.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "User Management", description = "CRUD operations and user administration")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "Get current authenticated user")
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal Jwt jwt) {
        UUID publicId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(userService.getByPublicId(publicId));
    }

    @Operation(summary = "List all users")
    @ApiResponse(responseCode = "200", description = "Users listed")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<Page<UserResponse>> list(
            @RequestParam(required = false) String role,
            Pageable pageable) {
        Page<UserResponse> page = (role != null)
                ? userService.findByRole(role, pageable)
                : userService.findAll(pageable);
        return ResponseEntity.ok(page);
    }

    @Operation(summary = "Get user by ID")
    @ApiResponse(responseCode = "200", description = "User found")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getByPublicId(id));
    }

    @Operation(summary = "Create new user")
    @ApiResponse(responseCode = "201", description = "User created")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        UserResponse response = userService.create(request);
        URI location = URI.create("/api/v1/users/" + response.id());
        return ResponseEntity.created(location).body(response);
    }

    @Operation(summary = "Update user")
    @ApiResponse(responseCode = "200", description = "User updated")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.update(id, request));
    }

    @Operation(summary = "Change user role")
    @ApiResponse(responseCode = "204", description = "Role changed")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/change-role")
    public ResponseEntity<Void> changeRole(
            @PathVariable UUID id,
            @RequestParam UUID roleId) {
        userService.changeRole(id, roleId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Toggle user enabled/disabled")
    @ApiResponse(responseCode = "204", description = "Status toggled")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/toggle-status")
    public ResponseEntity<Void> toggleStatus(@PathVariable UUID id) {
        userService.toggleStatus(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Soft delete user")
    @ApiResponse(responseCode = "204", description = "User deleted")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        // TODO: extract user internal ID from JWT for deletedBy tracking
        userService.softDelete(id, null);
        return ResponseEntity.noContent().build();
    }
}
