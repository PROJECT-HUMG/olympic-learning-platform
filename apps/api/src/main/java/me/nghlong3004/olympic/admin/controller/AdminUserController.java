package me.nghlong3004.olympic.admin.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.admin.request.AdminCreateUserRequest;
import me.nghlong3004.olympic.admin.response.AdminCreateUserResponse;
import me.nghlong3004.olympic.admin.response.AdminUserResponse;
import me.nghlong3004.olympic.admin.response.PermissionResponse;
import me.nghlong3004.olympic.admin.service.UserAdministrationService;
import me.nghlong3004.olympic.user.enums.Permission;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/30/2026
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Tag(name = "Admin User", description = "Admin API for managing users")
public class AdminUserController {

  private final UserAdministrationService userAdministrationService;

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Create an internal account and queue its one-time invitation after commit")
  @ApiResponse(responseCode = "201", description = "Pending account created; email delivery queued")
  @ApiResponse(responseCode = "400", description = "Invalid account fields or role")
  @ApiResponse(responseCode = "401", description = "Authentication required")
  @ApiResponse(responseCode = "403", description = "Administrator access required")
  @ApiResponse(responseCode = "409", description = "Email or username already exists")
  public ResponseEntity<AdminCreateUserResponse> invite(
      @Valid @RequestBody AdminCreateUserRequest request, HttpServletRequest servletRequest) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .cacheControl(CacheControl.noStore())
        .body(
            userAdministrationService.createUser(
                request, servletRequest.getRemoteAddr(), servletRequest.getHeader("User-Agent")));
  }

  @GetMapping
  @Operation(summary = "Search users with pagination")
  public Page<AdminUserResponse> searchUsers(
      @RequestParam(required = false, defaultValue = "") String search,
      @ParameterObject Pageable pageable) {
    return userAdministrationService.searchUsers(search, pageable);
  }

  @GetMapping("/permissions")
  @Operation(summary = "Get all available permissions")
  public List<PermissionResponse> getAvailablePermissions() {
    return Arrays.stream(Permission.values())
        .map(p -> new PermissionResponse(p.name(), p.getDescription()))
        .toList();
  }

  @PostMapping("/{userId}/permissions/{permission}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Grant a specific permission to a user")
  public void grantPermission(@PathVariable UUID userId, @PathVariable Permission permission) {
    userAdministrationService.grantPermission(userId, permission);
  }

  @DeleteMapping("/{userId}/permissions/{permission}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Revoke a specific permission from a user")
  public void revokePermission(@PathVariable UUID userId, @PathVariable Permission permission) {
    userAdministrationService.revokePermission(userId, permission);
  }
}
