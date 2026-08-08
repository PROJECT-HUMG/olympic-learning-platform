package me.nghlong3004.olympic.post.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.post.request.CreatePostRequest;
import me.nghlong3004.olympic.post.request.PostSearchRequest;
import me.nghlong3004.olympic.post.request.UpdatePostRequest;
import me.nghlong3004.olympic.post.response.PostDetailResponse;
import me.nghlong3004.olympic.post.response.PostSummaryResponse;
import me.nghlong3004.olympic.post.service.PostService;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/04/2026
 */
@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
@Tag(name = "Post", description = "Post management APIs")
public class PostController {

  private final PostService postService;

  @PostMapping
  @Operation(summary = "Create a new post")
  @ResponseStatus(HttpStatus.CREATED)
  public PostDetailResponse create(@Valid @RequestBody CreatePostRequest request) {
    return postService.create(request);
  }

  @PutMapping("/{id}")
  @Operation(summary = "Update an existing post")
  @ResponseStatus(HttpStatus.OK)
  public PostDetailResponse update(
      @PathVariable UUID id, @Valid @RequestBody UpdatePostRequest request) {
    return postService.update(id, request);
  }

  @GetMapping("/slug/{slug}")
  @Operation(summary = "Get post details by slug")
  @ResponseStatus(HttpStatus.OK)
  public PostDetailResponse getBySlug(@PathVariable String slug) {
    return postService.getBySlug(slug);
  }

  @GetMapping("/{id}")
  @Operation(summary = "Get post details by ID")
  @ResponseStatus(HttpStatus.OK)
  public PostDetailResponse getById(@PathVariable UUID id) {
    return postService.getById(id);
  }

  @GetMapping
  @Operation(summary = "Get paginated posts")
  @ResponseStatus(HttpStatus.OK)
  public Page<PostSummaryResponse> getAll(@ParameterObject PostSearchRequest request, @ParameterObject Pageable pageable) {
    return postService.getAll(request, pageable);
  }

  @DeleteMapping("/{id}")
  @Operation(summary = "Soft delete a post")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable UUID id) {
    postService.delete(id);
  }
}
