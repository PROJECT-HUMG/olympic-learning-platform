package me.nghlong3004.olympic.storage.dto;

import me.nghlong3004.olympic.storage.enums.StorageProvider;

/**
 * Immutable metadata snapshot returned by {@link
 * me.nghlong3004.olympic.storage.service.StorageService#upload} after a file has been successfully
 * persisted to the external provider. Contains everything the caller needs to construct and save a
 * {@link me.nghlong3004.olympic.storage.entity.FileEntity}.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/23/2026
 */
public record UploadedFile(
    String storageKey,
    String originalName,
    String contentType,
    long size,
    StorageProvider provider) {}
