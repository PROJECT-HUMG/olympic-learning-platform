package me.nghlong3004.olympic.storage.service;

import me.nghlong3004.olympic.storage.dto.UploadedFile;
import me.nghlong3004.olympic.storage.enums.StorageFolder;
import org.springframework.web.multipart.MultipartFile;

/**
 * Provider-agnostic contract for file storage operations.
 *
 * <p>Business services depend on this interface only — never on a concrete provider SDK. At runtime
 * a single implementation is activated via {@code olympic.storage.provider} configuration, letting
 * the application switch between Cloudinary, AWS S3, MinIO, or local storage without touching any
 * business code.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/23/2026
 */
public interface StorageService {

  /**
   * Uploads a file to the configured provider under the given logical folder.
   *
   * @param file multipart file payload
   * @param folder target logical folder
   * @return metadata of the newly stored file
   */
  UploadedFile upload(MultipartFile file, StorageFolder folder);

  /**
   * Permanently deletes a file from the provider.
   *
   * @param storageKey provider-side key returned at upload time
   */
  void delete(String storageKey);

  /**
   * Resolves the public URL for a previously stored file.
   *
   * @param storageKey provider-side key
   * @return fully qualified public URL
   */
  String getPublicUrl(String storageKey);
}
