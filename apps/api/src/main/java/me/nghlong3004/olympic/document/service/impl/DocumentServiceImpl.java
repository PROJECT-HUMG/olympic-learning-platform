package me.nghlong3004.olympic.document.service.impl;

import java.net.URI;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.document.entity.Document;
import me.nghlong3004.olympic.document.entity.DocumentCategory;
import me.nghlong3004.olympic.document.entity.Subject;
import me.nghlong3004.olympic.document.entity.Tag;
import me.nghlong3004.olympic.document.exception.DocumentNotFoundException;
import me.nghlong3004.olympic.document.mapper.DocumentMapper;
import me.nghlong3004.olympic.document.repository.DocumentCategoryRepository;
import me.nghlong3004.olympic.document.repository.DocumentRepository;
import me.nghlong3004.olympic.document.repository.SubjectRepository;
import me.nghlong3004.olympic.document.repository.TagRepository;
import me.nghlong3004.olympic.document.request.CreateDocumentRequest;
import me.nghlong3004.olympic.document.request.DocumentSearchRequest;
import me.nghlong3004.olympic.document.request.UpdateDocumentRequest;
import me.nghlong3004.olympic.document.response.DocumentResponse;
import me.nghlong3004.olympic.document.service.DocumentService;
import me.nghlong3004.olympic.document.service.SearchTextNormalizer;
import me.nghlong3004.olympic.document.service.SlugGenerator;
import me.nghlong3004.olympic.document.specification.DocumentSpecification;
import me.nghlong3004.olympic.storage.entity.File;
import me.nghlong3004.olympic.storage.repository.FileRepository;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.enums.Permission;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.repository.UserRepository;
import me.nghlong3004.olympic.user.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DocumentServiceImpl implements DocumentService {

  private final DocumentRepository documentRepository;
  private final DocumentCategoryRepository categoryRepository;
  private final SubjectRepository subjectRepository;
  private final TagRepository tagRepository;
  private final FileRepository fileRepository;
  private final UserRepository userRepository;
  private final StorageService storageService;
  private final DocumentMapper documentMapper;
  private final SlugGenerator slugGenerator;
  private final SearchTextNormalizer searchTextNormalizer;
  private final CurrentUserProvider currentUserProvider;

  @Override
  @Transactional
  @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER') or hasAuthority('DOCUMENT_UPLOAD')")
  public DocumentResponse create(CreateDocumentRequest request) {
    CurrentUser currentUser = currentUserProvider.getCurrentUser();
    User owner =
        userRepository
            .findByIdAndDeletedAtIsNull(currentUser.id())
            .orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);

    File file =
        fileRepository
            .findById(request.fileId())
            .orElseThrow(() -> ErrorCode.FILE_NOT_FOUND.throwIt("File not found"));

    DocumentCategory category =
        categoryRepository
            .findByIdAndEnabledTrue(request.categoryId())
            .orElseThrow(() -> ErrorCode.RESOURCE_NOT_FOUND.throwIt("Category not found or disabled"));

    Subject subject =
        subjectRepository
            .findByIdAndEnabledTrue(request.subjectId())
            .orElseThrow(() -> ErrorCode.RESOURCE_NOT_FOUND.throwIt("Subject not found or disabled"));

    List<Tag> tagsList = tagRepository.findAllByIdInAndEnabledTrue(request.tagIds());
    if (tagsList.size() != request.tagIds().size()) {
      throw ErrorCode.RESOURCE_NOT_FOUND.throwIt("Some tags not found or disabled");
    }

    String slug = slugGenerator.generate(request.title());
    if (documentRepository.existsBySlug(slug)) {
      slug = slug + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    String searchText = searchTextNormalizer.normalize(request.title(), request.description());

    Document document =
        Document.builder()
            .title(request.title())
            .slug(slug)
            .description(request.description())
            .searchText(searchText)
            .file(file)
            .owner(owner)
            .category(category)
            .subject(subject)
            .tags(Set.copyOf(tagsList))
            .build();

    document = documentRepository.save(document);
    log.info("Document {} created by user {}", document.getId(), owner.getId());

    return enrich(documentMapper.toResponse(document), document);
  }

  @Override
  @Transactional
  public DocumentResponse update(UUID id, UpdateDocumentRequest request) {
    Document document = getDocumentForUpdate(id);
    
    checkUpdateDeletePermission(document);

    DocumentCategory category =
        categoryRepository
            .findByIdAndEnabledTrue(request.categoryId())
            .orElseThrow(() -> ErrorCode.RESOURCE_NOT_FOUND.throwIt("Category not found or disabled"));

    Subject subject =
        subjectRepository
            .findByIdAndEnabledTrue(request.subjectId())
            .orElseThrow(() -> ErrorCode.RESOURCE_NOT_FOUND.throwIt("Subject not found or disabled"));

    List<Tag> tagsList = tagRepository.findAllByIdInAndEnabledTrue(request.tagIds());
    if (tagsList.size() != request.tagIds().size()) {
      throw ErrorCode.RESOURCE_NOT_FOUND.throwIt("Some tags not found or disabled");
    }

    boolean titleChanged = !document.getTitle().equals(request.title());
    
    document.setTitle(request.title());
    document.setDescription(request.description());
    document.setCategory(category);
    document.setSubject(subject);
    document.setTags(Set.copyOf(tagsList));

    if (titleChanged) {
      String slug = slugGenerator.generate(request.title());
      if (documentRepository.existsBySlug(slug)) {
        slug = slug + "-" + UUID.randomUUID().toString().substring(0, 8);
      }
      document.setSlug(slug);
    }

    String searchText = searchTextNormalizer.normalize(request.title(), request.description());
    document.setSearchText(searchText);

    log.info("Document {} updated by user {}", document.getId(), currentUserProvider.getCurrentUser().id());

    return enrich(documentMapper.toResponse(document), document);
  }

  @Override
  @Transactional
  public DocumentResponse getBySlug(String slug) {
    Document document =
        documentRepository
            .findBySlugAndDeletedAtIsNull(slug)
            .orElseThrow(() -> new DocumentNotFoundException(slug));
            
    document.setViewCount(document.getViewCount() + 1);

    return enrich(documentMapper.toResponse(document), document);
  }

  @Override
  public Page<DocumentResponse> search(DocumentSearchRequest request, Pageable pageable) {
    return documentRepository
        .findAll(DocumentSpecification.from(request), pageable)
        .map(doc -> enrich(documentMapper.toResponse(doc), doc));
  }

  @Override
  @Transactional
  public void delete(UUID id) {
    Document document = getDocumentForUpdate(id);
    
    checkUpdateDeletePermission(document);

    document.setDeletedAt(OffsetDateTime.now());
    
    log.info("Document {} soft deleted by user {}", document.getId(), currentUserProvider.getCurrentUser().id());
  }

  @Override
  @Transactional
  public URI getDownloadUriBySlug(String slug) {
    Document document =
        documentRepository
            .findBySlugAndDeletedAtIsNull(slug)
            .orElseThrow(() -> new DocumentNotFoundException(slug));
    
    document.setDownloadCount(document.getDownloadCount() + 1);
    
    return storageService.getDownloadUri(document.getFile().getStorageKey());
  }
  
  @Override
  @Transactional
  public void bulkDelete(List<UUID> ids) {
    checkAdminPermission();
    int count = documentRepository.softDeleteByIds(ids);
    log.info("Admin {} bulk deleted {} documents", currentUserProvider.getCurrentUser().id(), count);
  }

  @Override
  @Transactional
  public void deleteByUserId(UUID userId) {
    checkAdminPermission();
    int count = documentRepository.softDeleteByOwnerId(userId);
    log.info("Admin {} deleted {} documents created by user {}", currentUserProvider.getCurrentUser().id(), count, userId);
  }

  @Override
  @Transactional
  public void incrementViewCountBySlug(String slug) {
    documentRepository.incrementViewCountBySlug(slug);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------
  
  private Document getDocumentForUpdate(UUID id) {
      Document document = documentRepository.findForUpdateById(id)
              .orElseThrow(() -> new DocumentNotFoundException(id));
      if (document.getDeletedAt() != null) {
          throw new DocumentNotFoundException(id);
      }
      return document;
  }

  private DocumentResponse enrich(DocumentResponse response, Document document) {
    String downloadUrl = null;
    String thumbnailUrl = null;
    
    if (document.getFile() != null) {
        URI dUri = storageService.getDownloadUri(document.getFile().getStorageKey());
        if (dUri != null) {
            downloadUrl = dUri.toString();
        }
        URI tUri = storageService.getThumbnailUri(document.getFile().getStorageKey());
        if (tUri != null) {
            thumbnailUrl = tUri.toString();
        }
    }
    
    UserResponse enrichedOwner = response.owner();
    if (document.getOwner() != null && document.getOwner().getAvatar() != null) {
        URI avatarUri = storageService.getDownloadUri(document.getOwner().getAvatar().getStorageKey());
        if (avatarUri != null) {
            enrichedOwner = enrichedOwner.withAvatarUrl(avatarUri.toString());
        }
    }
    
    return response.toBuilder()
            .downloadUrl(downloadUrl)
            .thumbnailUrl(thumbnailUrl)
            .owner(enrichedOwner)
            .build();
  }
  

  private void checkUpdateDeletePermission(Document document) {
      CurrentUser currentUser = currentUserProvider.getCurrentUser();
      User user = userRepository.findByIdAndDeletedAtIsNull(currentUser.id())
              .orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);
              
      if (user.getRole() == Role.ADMIN) {
          return;
      }
      if (document.getOwner().getId().equals(user.getId())) {
          return;
      }
      if (currentUser.role() == Role.ADMIN) {
      return;
    }
    throw ErrorCode.ACCESS_DENIED.throwIt("You do not have permission to modify this document");
  }

  private void checkAdminPermission() {
    if (currentUserProvider.getCurrentUser().role() != Role.ADMIN) {
      throw ErrorCode.ACCESS_DENIED.throwIt("Admin permission required");
    }
  }
}
