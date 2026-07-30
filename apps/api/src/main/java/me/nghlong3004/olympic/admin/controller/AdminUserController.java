package me.nghlong3004.olympic.admin.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.admin.response.AdminUserResponse;
import me.nghlong3004.olympic.admin.response.PermissionResponse;
import me.nghlong3004.olympic.admin.service.UserAdministrationService;
import me.nghlong3004.olympic.user.enums.Permission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

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
  public void grantPermission(
      @PathVariable UUID userId, 
      @PathVariable Permission permission) {
    userAdministrationService.grantPermission(userId, permission);
  }

  @DeleteMapping("/{userId}/permissions/{permission}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Revoke a specific permission from a user")
  public void revokePermission(
      @PathVariable UUID userId, 
      @PathVariable Permission permission) {
    userAdministrationService.revokePermission(userId, permission);
  }
}
