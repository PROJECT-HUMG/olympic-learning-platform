package me.nghlong3004.olympic.storage.service;

import java.net.URI;
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
   * Uploads a file into the specified logical storage folder.
   *
   * @param file the uploaded multipart file
   * @param folder the logical destination folder
   * @return metadata describing the stored file
   */
  UploadedFile upload(MultipartFile file, StorageFolder folder);

  /**
   * Deletes a previously stored file.
   *
   * <p>If the file does not exist, implementations should silently ignore the request.
   *
   * @param storageKey unique storage key
   */
  void delete(String storageKey);

  /**
   * Resolves a browser-accessible download URL for the stored file.
   *
   * <p>The returned URL may be public or time-limited depending on the storage provider.
   *
   * @param storageKey unique storage key
   * @return download URI
   */
  URI getDownloadUri(String storageKey);

  /**
   * Resolves a thumbnail URL for the stored file.
   *
   * <p>Implementations may generate the thumbnail dynamically or return a pre-generated thumbnail
   * depending on provider capabilities.
   *
   * @param storageKey unique storage key
   * @return thumbnail URI
   */
  URI getThumbnailUri(String storageKey);
}
