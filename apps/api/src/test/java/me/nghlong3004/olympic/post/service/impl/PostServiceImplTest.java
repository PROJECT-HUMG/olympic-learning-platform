package me.nghlong3004.olympic.post.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.common.util.SlugGenerator;
import me.nghlong3004.olympic.post.entity.Post;
import me.nghlong3004.olympic.post.enums.PostStatus;
import me.nghlong3004.olympic.post.enums.PostType;
import me.nghlong3004.olympic.post.exception.PostNotFoundException;
import me.nghlong3004.olympic.post.mapper.PostMapper;
import me.nghlong3004.olympic.post.repository.PostRepository;
import me.nghlong3004.olympic.post.request.CreatePostRequest;
import me.nghlong3004.olympic.post.request.UpdatePostRequest;
import me.nghlong3004.olympic.post.response.PostDetailResponse;
import me.nghlong3004.olympic.post.response.PostSummaryResponse;
import me.nghlong3004.olympic.storage.repository.FileRepository;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class PostServiceImplTest {

  @Mock private PostRepository postRepository;
  @Mock private UserRepository userRepository;
  @Mock private FileRepository fileRepository;
  @Mock private StorageService storageService;
  @Mock private PostMapper postMapper;
  @Mock private SlugGenerator slugGenerator;
  @Mock private CurrentUserProvider currentUserProvider;

  @InjectMocks private PostServiceImpl postService;

  private UUID currentUserId;
  private CurrentUser currentUser;
  private User authorUser;

  @BeforeEach
  void setUp() {
    currentUserId = UUID.randomUUID();
    currentUser = CurrentUser.builder().id(currentUserId).role(Role.STUDENT).build();
    authorUser = User.builder().id(currentUserId).role(Role.STUDENT).build();
  }

  @Test
  void create_HappyPath() {
    when(currentUserProvider.getCurrentUser()).thenReturn(currentUser);
    when(userRepository.findByIdAndDeletedAtIsNull(currentUserId)).thenReturn(Optional.of(authorUser));

    CreatePostRequest request = new CreatePostRequest("Test Title", "Test Summary", "Test Content", null, PostType.NEWS, PostStatus.PUBLISHED, OffsetDateTime.now(), null);
    
    when(slugGenerator.generate("Test Title")).thenReturn("test-title");
    when(postRepository.existsBySlug("test-title")).thenReturn(false);

    Post savedPost = Post.builder().id(UUID.randomUUID()).build();
    when(postRepository.save(any(Post.class))).thenAnswer(invocation -> {
      Post p = invocation.getArgument(0);
      assertThat(p.getSlug()).isEqualTo("test-title");
      return savedPost;
    });

    when(postMapper.toDetailResponse(savedPost)).thenReturn(PostDetailResponse.builder().id(savedPost.getId()).build());

    PostDetailResponse response = postService.create(request);

    assertThat(response.id()).isEqualTo(savedPost.getId());
    verify(postRepository).save(any(Post.class));
  }

  @Test
  void create_DuplicateSlug_AppendsRandomString() {
    when(currentUserProvider.getCurrentUser()).thenReturn(currentUser);
    when(userRepository.findByIdAndDeletedAtIsNull(currentUserId)).thenReturn(Optional.of(authorUser));

    CreatePostRequest request = new CreatePostRequest("Test Title", "Test Summary", "Test Content", null, PostType.NEWS, PostStatus.PUBLISHED, OffsetDateTime.now(), null);
    
    when(slugGenerator.generate("Test Title")).thenReturn("test-title");
    when(postRepository.existsBySlug("test-title")).thenReturn(true);

    Post savedPost = Post.builder().id(UUID.randomUUID()).build();
    when(postRepository.save(any(Post.class))).thenAnswer(invocation -> {
      Post p = invocation.getArgument(0);
      assertThat(p.getSlug()).startsWith("test-title-");
      return savedPost;
    });

    when(postMapper.toDetailResponse(savedPost)).thenReturn(PostDetailResponse.builder().id(savedPost.getId()).build());

    postService.create(request);
    verify(postRepository).save(any(Post.class));
  }

  @Test
  void create_UserNotFound_ThrowsApiException() {
    when(currentUserProvider.getCurrentUser()).thenReturn(currentUser);
    when(userRepository.findByIdAndDeletedAtIsNull(currentUserId)).thenReturn(Optional.empty());

    CreatePostRequest request = new CreatePostRequest("Title", "Sum", "Cont", null, PostType.NEWS, PostStatus.DRAFT, null, null);
    
    assertThatThrownBy(() -> postService.create(request))
        .isInstanceOf(ApiException.class)
        .matches(e -> ((ApiException) e).getErrorCode() == ErrorCode.USER_NOT_FOUND);
        
    verify(postRepository, never()).save(any());
  }
  
  @Test
  void update_HappyPath_NoSlugChange() {
    UUID postId = UUID.randomUUID();
    Post post = Post.builder().id(postId).author(authorUser).title("Old Title").slug("old-title").build();
    when(postRepository.findById(postId)).thenReturn(Optional.of(post));
    
    when(currentUserProvider.getCurrentUser()).thenReturn(currentUser);
    when(userRepository.findByIdAndDeletedAtIsNull(currentUserId)).thenReturn(Optional.of(authorUser));

    UpdatePostRequest request = new UpdatePostRequest("Old Title", "New Sum", "New Cont", null, PostType.NEWS, PostStatus.PUBLISHED, null, null);
    
    when(postMapper.toDetailResponse(post)).thenReturn(PostDetailResponse.builder().id(postId).build());

    postService.update(postId, request);

    assertThat(post.getSummary()).isEqualTo("New Sum");
    assertThat(post.getSlug()).isEqualTo("old-title");
  }

  @Test
  void update_TitleChanged_RegeneratesSlug() {
    UUID postId = UUID.randomUUID();
    Post post = Post.builder().id(postId).author(authorUser).title("Old Title").slug("old-title").build();
    when(postRepository.findById(postId)).thenReturn(Optional.of(post));
    
    when(currentUserProvider.getCurrentUser()).thenReturn(currentUser);
    when(userRepository.findByIdAndDeletedAtIsNull(currentUserId)).thenReturn(Optional.of(authorUser));

    UpdatePostRequest request = new UpdatePostRequest("New Title", "New Sum", "New Cont", null, PostType.NEWS, PostStatus.PUBLISHED, null, null);
    
    when(slugGenerator.generate("New Title")).thenReturn("new-title");
    when(postRepository.existsBySlug("new-title")).thenReturn(false);
    when(postMapper.toDetailResponse(post)).thenReturn(PostDetailResponse.builder().id(postId).build());

    postService.update(postId, request);

    assertThat(post.getTitle()).isEqualTo("New Title");
    assertThat(post.getSlug()).isEqualTo("new-title");
  }

  @Test
  void update_UnauthorizedAccess_ThrowsApiException() {
    UUID postId = UUID.randomUUID();
    User differentAuthor = User.builder().id(UUID.randomUUID()).role(Role.STUDENT).build();
    Post post = Post.builder().id(postId).author(differentAuthor).build();
    when(postRepository.findById(postId)).thenReturn(Optional.of(post));
    
    when(currentUserProvider.getCurrentUser()).thenReturn(currentUser);
    when(userRepository.findByIdAndDeletedAtIsNull(currentUserId)).thenReturn(Optional.of(authorUser));

    UpdatePostRequest request = new UpdatePostRequest("Title", "Sum", "Cont", null, PostType.NEWS, PostStatus.PUBLISHED, null, null);

    assertThatThrownBy(() -> postService.update(postId, request))
        .isInstanceOf(ApiException.class)
        .matches(e -> ((ApiException) e).getErrorCode() == ErrorCode.ACCESS_DENIED);
  }

  @Test
  void update_PostNotFound_ThrowsPostNotFoundException() {
    UUID postId = UUID.randomUUID();
    when(postRepository.findById(postId)).thenReturn(Optional.empty());

    UpdatePostRequest request = new UpdatePostRequest("Title", "Sum", "Cont", null, PostType.NEWS, PostStatus.PUBLISHED, null, null);

    assertThatThrownBy(() -> postService.update(postId, request))
        .isInstanceOf(PostNotFoundException.class);
  }

  @Test
  void getBySlug_HappyPath() {
    Post post = Post.builder().id(UUID.randomUUID()).viewCount(5L).build();
    when(postRepository.findBySlug("test-slug")).thenReturn(Optional.of(post));
    when(postMapper.toDetailResponse(post)).thenReturn(PostDetailResponse.builder().id(post.getId()).build());

    postService.getBySlug("test-slug");

    assertThat(post.getViewCount()).isEqualTo(6L);
    verify(postMapper).toDetailResponse(post);
  }

  @Test
  void getBySlug_DeletedPost_ThrowsPostNotFoundException() {
    Post post = Post.builder().id(UUID.randomUUID()).deletedAt(OffsetDateTime.now()).build();
    when(postRepository.findBySlug("test-slug")).thenReturn(Optional.of(post));

    assertThatThrownBy(() -> postService.getBySlug("test-slug"))
        .isInstanceOf(PostNotFoundException.class);
  }

  @Test
  void getById_UnexpectedRepositoryError_PropagatesException() {
    UUID postId = UUID.randomUUID();
    when(postRepository.findById(postId)).thenThrow(new RuntimeException("Database error"));

    assertThatThrownBy(() -> postService.getById(postId))
        .isInstanceOf(RuntimeException.class)
        .hasMessage("Database error");
  }

  @Test
  void getAll_HappyPath() {
    Post post = Post.builder().id(UUID.randomUUID()).build();
    Page<Post> page = new PageImpl<>(List.of(post));
    when(postRepository.findAll(any(Pageable.class))).thenReturn(page);
    when(postMapper.toSummaryResponse(post)).thenReturn(PostSummaryResponse.builder().id(post.getId()).build());

    Page<PostSummaryResponse> result = postService.getAll(Pageable.unpaged());

    assertThat(result.getContent()).hasSize(1);
    assertThat(result.getContent().get(0).id()).isEqualTo(post.getId());
  }

  @Test
  void delete_HappyPath() {
    UUID postId = UUID.randomUUID();
    Post post = Post.builder().id(postId).author(authorUser).build();
    when(postRepository.findById(postId)).thenReturn(Optional.of(post));
    
    when(currentUserProvider.getCurrentUser()).thenReturn(currentUser);
    when(userRepository.findByIdAndDeletedAtIsNull(currentUserId)).thenReturn(Optional.of(authorUser));

    postService.delete(postId);

    assertThat(post.getDeletedAt()).isNotNull();
  }
}
