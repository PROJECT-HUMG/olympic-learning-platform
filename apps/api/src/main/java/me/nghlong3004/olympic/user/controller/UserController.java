package me.nghlong3004.olympic.user.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.auth.response.CurrentUserResponse;
import me.nghlong3004.olympic.user.request.UpdateProfileRequest;
import me.nghlong3004.olympic.user.response.UserResponse;
import me.nghlong3004.olympic.user.service.UserService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/23/2026
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "User profile APIs")
public class UserController {

  private final UserService userService;

  @GetMapping("/me")
  @Operation(summary = "Get the current authenticated user's profile")
  @ApiResponse(responseCode = "200", description = "Current user profile")
  @ApiResponse(responseCode = "401", description = "Authentication required")
  public CurrentUserResponse me() {
    return userService.me();
  }

  @GetMapping("/{userId}")
  @Operation(summary = "Get a user profile by id")
  @ApiResponse(responseCode = "200", description = "User profile")
  @ApiResponse(responseCode = "404", description = "User not found")
  public UserResponse findById(@PathVariable UUID userId) {
    return userService.findById(userId);
  }

  @PatchMapping("/me")
  @Operation(summary = "Update the current user's profile")
  @ApiResponse(responseCode = "200", description = "Profile updated")
  @ApiResponse(responseCode = "400", description = "Validation failed")
  @ApiResponse(responseCode = "401", description = "Authentication required")
  public UserResponse updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
    return userService.updateProfile(request);
  }

  @PutMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(summary = "Update the current user's avatar")
  @ApiResponse(responseCode = "200", description = "Avatar updated")
  @ApiResponse(responseCode = "400", description = "Invalid avatar")
  @ApiResponse(responseCode = "401", description = "Authentication required")
  public UserResponse updateAvatar(@RequestParam("avatar") MultipartFile avatar) {
    return userService.updateAvatar(avatar);
  }

  @DeleteMapping("/me/avatar")
  @Operation(summary = "Remove the current user's avatar")
  @ApiResponse(responseCode = "200", description = "Avatar removed")
  @ApiResponse(responseCode = "401", description = "Authentication required")
  public UserResponse removeAvatar() {
    return userService.removeAvatar();
  }
}
