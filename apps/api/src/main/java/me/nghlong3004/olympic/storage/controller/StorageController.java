package me.nghlong3004.olympic.storage.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.storage.dto.UploadedFile;
import me.nghlong3004.olympic.storage.entity.File;
import me.nghlong3004.olympic.storage.enums.StorageFolder;
import me.nghlong3004.olympic.storage.mapper.FileMapper;
import me.nghlong3004.olympic.storage.repository.FileRepository;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
@RestController
@RequestMapping("/api/v1/storage")
@RequiredArgsConstructor
@Tag(name = "Storage", description = "File storage and upload APIs")
public class StorageController {

  private final StorageService storageService;
  private final FileRepository fileRepository;
  private final FileMapper fileMapper;
  private final CurrentUserProvider currentUserProvider;
  private final UserRepository userRepository;

  @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(summary = "Upload a file to a specific folder")
  @ResponseStatus(HttpStatus.CREATED)
  public StorageUploadResponse upload(
      @RequestParam("file") MultipartFile file,
      @RequestParam("folder") StorageFolder folder) {
      
    checkUploadPermission(folder);

    UploadedFile uploaded = storageService.upload(file, folder);
    File fileEntity = fileRepository.save(fileMapper.toEntity(uploaded, folder));

    return new StorageUploadResponse(
        fileEntity.getId(),
        storageService.getDownloadUri(fileEntity.getStorageKey()).toString()
    );
  }

  private void checkUploadPermission(StorageFolder folder) {
    if (folder != StorageFolder.DOCUMENT) {
      return;
    }

    CurrentUser currentUser = currentUserProvider.getCurrentUser();
    User user =
        userRepository
            .findByIdAndDeletedAtIsNull(currentUser.id())
            .orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);

    if (user.getRole() == Role.ADMIN || user.getRole() == Role.LECTURER) {
      return;
    }
    if (user.getRole() == Role.STUDENT && user.getPermissions().contains("DOCUMENT_UPLOAD")) {
      return;
    }

    throw ErrorCode.ACCESS_DENIED.throwIt("You do not have permission to upload documents");
  }

  public record StorageUploadResponse(UUID id, String url) {}
}
