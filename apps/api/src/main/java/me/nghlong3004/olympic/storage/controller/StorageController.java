package me.nghlong3004.olympic.storage.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.storage.enums.StorageFolder;
import me.nghlong3004.olympic.storage.response.StorageUploadResponse;
import me.nghlong3004.olympic.storage.service.StorageUploadService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
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

  private final StorageUploadService storageUploadService;

  @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(summary = "Upload a file to a specific folder")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize(
      "#folder.name() != 'DOCUMENT' or hasAnyRole('ADMIN', 'LECTURER') or"
          + " hasAuthority('DOCUMENT_UPLOAD')")
  public StorageUploadResponse upload(
      @RequestParam("file") MultipartFile file, @RequestParam("folder") StorageFolder folder) {

    return storageUploadService.upload(file, folder);
  }
}
