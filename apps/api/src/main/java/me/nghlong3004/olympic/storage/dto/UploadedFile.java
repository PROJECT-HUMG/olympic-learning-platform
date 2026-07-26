package me.nghlong3004.olympic.storage.dto;

import me.nghlong3004.olympic.storage.entity.File;
import me.nghlong3004.olympic.storage.enums.StorageFolder;
import me.nghlong3004.olympic.storage.enums.StorageProvider;
import me.nghlong3004.olympic.storage.service.StorageService;

/**
 * Immutable metadata snapshot returned by {@link StorageService#upload} after a file has been
 * successfully persisted to the external provider. Contains everything the caller needs to
 * construct and save a {@link File}.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/23/2026
 */
public record UploadedFile(
    String storageKey,
    String originalName,
    String contentType,
    long size,
    StorageProvider provider,
    StorageFolder folder) {}
