package me.nghlong3004.olympic.post.service.impl;

import java.net.URI;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.properties.UserProperties;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.common.util.SlugGenerator;
import me.nghlong3004.olympic.post.entity.Post;
import me.nghlong3004.olympic.post.enums.PostStatus;
import me.nghlong3004.olympic.post.exception.PostNotFoundException;
import me.nghlong3004.olympic.post.mapper.PostMapper;
import me.nghlong3004.olympic.post.repository.PostRepository;
import me.nghlong3004.olympic.post.repository.PostSpecifications;
import me.nghlong3004.olympic.post.request.CreatePostRequest;
import me.nghlong3004.olympic.post.request.PostSearchRequest;
import me.nghlong3004.olympic.post.request.UpdatePostRequest;
import me.nghlong3004.olympic.post.response.PostDetailResponse;
import me.nghlong3004.olympic.post.response.PostSummaryResponse;
import me.nghlong3004.olympic.post.response.PostStatusCountsResponse;
import me.nghlong3004.olympic.post.service.PostService;
import me.nghlong3004.olympic.storage.entity.File;
import me.nghlong3004.olympic.storage.repository.FileRepository;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.user.entity.User;
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
 * @since 8/04/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostServiceImpl implements PostService {

  private final PostRepository postRepository;
  private final UserRepository userRepository;
  private final FileRepository fileRepository;
  private final StorageService storageService;
  private final PostMapper postMapper;
  private final SlugGenerator slugGenerator;
  private final CurrentUserProvider currentUserProvider;
  private final UserProperties userProperties;

  @Override
  @Transactional
  @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
  public PostDetailResponse create(CreatePostRequest request) {
    CurrentUser currentUser = currentUserProvider.getCurrentUser();
    User author =
        userRepository
            .findByIdAndDeletedAtIsNull(currentUser.id())
            .orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);

    File thumbnail = null;
    if (request.thumbnailId() != null) {
      thumbnail =
          fileRepository
              .findById(request.thumbnailId())
              .orElseThrow(() -> ErrorCode.FILE_NOT_FOUND.throwIt("Thumbnail file not found"));
    }

    String slug = slugGenerator.generate(request.title());
    if (postRepository.existsBySlug(slug)) {
      slug = slug + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    OffsetDateTime publishedAt = resolvePublishedAt(request.status(), request.publishedAt(), null);
    validateExpiry(request.expiredAt(), publishedAt);

    Post post =
        Post.builder()
            .title(request.title())
            .slug(slug)
            .summary(request.summary())
            .content(request.content())
            .thumbnail(thumbnail)
            .type(request.type())
            .status(request.status())
            .publishedAt(publishedAt)
            .expiredAt(request.expiredAt())
            .pinned(request.status() == PostStatus.ARCHIVED ? false : request.pinned())
            .author(author)
            .build();

    post = postRepository.save(post);
    log.info("Post {} created by user {}", post.getId(), author.getId());

    return enrichDetail(postMapper.toDetailResponse(post), post);
  }

  @Override
  @Transactional
  public PostDetailResponse update(UUID id, UpdatePostRequest request) {
    Post post = getPostForUpdate(id);
    checkUpdateDeletePermission(post);

    File thumbnail = post.getThumbnail();
    if (request.thumbnailId() != null) {
      if (thumbnail == null || !thumbnail.getId().equals(request.thumbnailId())) {
        thumbnail =
            fileRepository
                .findById(request.thumbnailId())
                .orElseThrow(() -> ErrorCode.FILE_NOT_FOUND.throwIt("Thumbnail file not found"));
      }
    } else {
      thumbnail = null;
    }

    boolean titleChanged = !post.getTitle().equals(request.title());
    
    post.setTitle(request.title());
    post.setSummary(request.summary());
    post.setContent(request.content());
    post.setThumbnail(thumbnail);
    post.setType(request.type());
    post.setStatus(request.status());
    OffsetDateTime publishedAt = resolvePublishedAt(request.status(), request.publishedAt(), post.getPublishedAt());
    validateExpiry(request.expiredAt(), publishedAt);

    post.setPublishedAt(publishedAt);
    post.setExpiredAt(request.expiredAt());
    post.setPinned(request.status() == PostStatus.ARCHIVED ? false : request.pinned());

    if (titleChanged) {
      String slug = slugGenerator.generate(request.title());
      if (postRepository.existsBySlug(slug) && !post.getSlug().equals(slug)) {
        slug = slug + "-" + UUID.randomUUID().toString().substring(0, 8);
      }
      post.setSlug(slug);
    }

    log.info("Post {} updated by user {}", post.getId(), currentUserProvider.getCurrentUser().id());

    return enrichDetail(postMapper.toDetailResponse(post), post);
  }

  @Override
  @Transactional
  public PostDetailResponse getBySlug(String slug) {
    Post post =
        postRepository
            .findBySlug(slug)
            .orElseThrow(() -> new PostNotFoundException(slug));
            
    if (post.getDeletedAt() != null || post.getStatus() != PostStatus.PUBLISHED) {
        throw new PostNotFoundException(slug);
    }

    post.setViewCount(post.getViewCount() + 1);

    return enrichDetail(postMapper.toDetailResponse(post), post);
  }

  @Override
  public PostDetailResponse getById(UUID id) {
    Post post =
        postRepository
            .findById(id)
            .orElseThrow(() -> new PostNotFoundException(id));
            
    if (post.getDeletedAt() != null) {
        throw new PostNotFoundException(id);
    }

    checkUpdateDeletePermission(post);
    return enrichDetail(postMapper.toDetailResponse(post), post);
  }

  @Override
  public Page<PostSummaryResponse> getAll(PostSearchRequest request, Pageable pageable) {
    return postRepository
        .findAll(PostSpecifications.publicPosts(request, OffsetDateTime.now()), pageable)
        .map(post -> enrichSummary(postMapper.toSummaryResponse(post), post));
  }

  @Override
  public Page<PostSummaryResponse> getAll(Pageable pageable) {
    return postRepository.findAll(pageable)
        .map(post -> enrichSummary(postMapper.toSummaryResponse(post), post));
  }

  @Override
  @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
  public Page<PostSummaryResponse> getManagementPosts(PostSearchRequest request, Pageable pageable) {
    CurrentUser currentUser = currentUserProvider.getCurrentUser();
    UUID authorId = currentUser.role() == Role.ADMIN ? null : currentUser.id();

    return postRepository
        .findAll(PostSpecifications.managementPosts(request, authorId, OffsetDateTime.now()), pageable)
        .map(post -> enrichSummary(postMapper.toSummaryResponse(post), post));
  }

  @Override
  @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
  public PostStatusCountsResponse getManagementStatusCounts() {
    CurrentUser currentUser = currentUserProvider.getCurrentUser();
    UUID authorId = currentUser.role() == Role.ADMIN ? null : currentUser.id();
    OffsetDateTime now = OffsetDateTime.now();

    return new PostStatusCountsResponse(
        postRepository.count(PostSpecifications.status(PostStatus.DRAFT, authorId, now)),
        postRepository.count(PostSpecifications.status(PostStatus.PUBLISHED, authorId, now))
            - postRepository.count(PostSpecifications.expired(authorId, now)),
        postRepository.count(PostSpecifications.status(PostStatus.ARCHIVED, authorId, now)),
        postRepository.count(PostSpecifications.expired(authorId, now)));
  }

  @Override
  @Transactional
  public void delete(UUID id) {
    Post post = getPostForUpdate(id);
    checkUpdateDeletePermission(post);

    post.setDeletedAt(OffsetDateTime.now());
    
    log.info("Post {} soft deleted by user {}", post.getId(), currentUserProvider.getCurrentUser().id());
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------
  
  private Post getPostForUpdate(UUID id) {
      Post post = postRepository.findById(id)
              .orElseThrow(() -> new PostNotFoundException(id));
      if (post.getDeletedAt() != null) {
          throw new PostNotFoundException(id);
      }
      return post;
  }

  private PostDetailResponse enrichDetail(PostDetailResponse response, Post post) {
    String thumbnailUrl = null;
    if (post.getThumbnail() != null) {
        URI tUri = storageService.getDownloadUri(post.getThumbnail().getStorageKey());
        if (tUri != null) {
            thumbnailUrl = tUri.toString();
        }
    }
    
    UserResponse enrichedAuthor = response.author();
    if (post.getAuthor() != null && enrichedAuthor != null) {
        if (post.getAuthor().getAvatar() != null) {
            URI avatarUri = storageService.getDownloadUri(post.getAuthor().getAvatar().getStorageKey());
            if (avatarUri != null) {
                enrichedAuthor = enrichedAuthor.withAvatarUrl(avatarUri.toString());
            }
        } else {
            enrichedAuthor = enrichedAuthor.withAvatarUrl(userProperties.defaultAvatarUrl());
        }
    }
    
    return response.toBuilder()
            .thumbnailUrl(thumbnailUrl)
            .author(enrichedAuthor)
            .build();
  }

  private PostSummaryResponse enrichSummary(PostSummaryResponse response, Post post) {
    String thumbnailUrl = null;
    if (post.getThumbnail() != null) {
        URI tUri = storageService.getDownloadUri(post.getThumbnail().getStorageKey());
        if (tUri != null) {
            thumbnailUrl = tUri.toString();
        }
    }
    
    UserResponse enrichedAuthor = response.author();
    if (post.getAuthor() != null && enrichedAuthor != null) {
        if (post.getAuthor().getAvatar() != null) {
            URI avatarUri = storageService.getDownloadUri(post.getAuthor().getAvatar().getStorageKey());
            if (avatarUri != null) {
                enrichedAuthor = enrichedAuthor.withAvatarUrl(avatarUri.toString());
            }
        } else {
            enrichedAuthor = enrichedAuthor.withAvatarUrl(userProperties.defaultAvatarUrl());
        }
    }
    
    return response.toBuilder()
            .thumbnailUrl(thumbnailUrl)
            .author(enrichedAuthor)
            .build();
  }

  private void checkUpdateDeletePermission(Post post) {
      CurrentUser currentUser = currentUserProvider.getCurrentUser();
      User user = userRepository.findByIdAndDeletedAtIsNull(currentUser.id())
              .orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);
              
      if (user.getRole() == Role.ADMIN) {
          return;
      }
      if (post.getAuthor().getId().equals(user.getId())) {
          return;
      }
      throw ErrorCode.ACCESS_DENIED.throwIt("You do not have permission to modify this post");
  }

  private OffsetDateTime resolvePublishedAt(
      PostStatus status, OffsetDateTime requestedPublishedAt, OffsetDateTime existingPublishedAt) {
    if (status != PostStatus.PUBLISHED) {
      return existingPublishedAt;
    }
    if (existingPublishedAt != null) {
      return existingPublishedAt;
    }
    return requestedPublishedAt != null ? requestedPublishedAt : OffsetDateTime.now();
  }

  private void validateExpiry(OffsetDateTime expiredAt, OffsetDateTime publishedAt) {
    if (expiredAt != null && publishedAt != null && !expiredAt.isAfter(publishedAt)) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("Expiry time must be after the publication time");
    }
  }

}
