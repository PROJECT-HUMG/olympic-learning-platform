package me.nghlong3004.olympic.post.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.post.enums.PostStatus;
import me.nghlong3004.olympic.post.enums.PostType;
import me.nghlong3004.olympic.post.request.CreatePostRequest;
import me.nghlong3004.olympic.post.request.UpdatePostRequest;
import me.nghlong3004.olympic.post.response.PostDetailResponse;
import me.nghlong3004.olympic.post.response.PostSummaryResponse;
import me.nghlong3004.olympic.post.service.PostService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PostController.class)
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = {
    "spring.security.oauth2.client.registration.google.client-id=test",
    "spring.security.oauth2.client.registration.google.client-secret=test",
    "spring.security.oauth2.client.registration.github.client-id=test",
    "spring.security.oauth2.client.registration.github.client-secret=test"
})
class PostControllerTest {

  @Autowired private MockMvc mockMvc;
  private ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

  @MockitoBean private PostService postService;

  @Test
  void create_ValidRequest_Returns201AndPostDetail() throws Exception {
    CreatePostRequest request = new CreatePostRequest("Valid Title", "Sum", "Cont", null, PostType.NEWS, PostStatus.PUBLISHED, null, null);
    
    UUID id = UUID.randomUUID();
    PostDetailResponse response = PostDetailResponse.builder().id(id).title("Valid Title").build();
    
    when(postService.create(any(CreatePostRequest.class))).thenReturn(response);

    mockMvc.perform(post("/api/v1/posts")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").value(id.toString()))
        .andExpect(jsonPath("$.title").value("Valid Title"));
        
    verify(postService).create(any(CreatePostRequest.class));
  }

  @Test
  void create_InvalidRequest_Returns400() throws Exception {
    CreatePostRequest request = new CreatePostRequest("", "Sum", "Cont", null, PostType.NEWS, PostStatus.PUBLISHED, null, null);
    
    mockMvc.perform(post("/api/v1/posts")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void update_ValidRequest_Returns200AndPostDetail() throws Exception {
    UUID id = UUID.randomUUID();
    UpdatePostRequest request = new UpdatePostRequest("New Title", "Sum", "Cont", null, PostType.NEWS, PostStatus.PUBLISHED, null, null);
    
    PostDetailResponse response = PostDetailResponse.builder().id(id).title("New Title").build();
    when(postService.update(eq(id), any(UpdatePostRequest.class))).thenReturn(response);

    mockMvc.perform(put("/api/v1/posts/{id}", id)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(id.toString()))
        .andExpect(jsonPath("$.title").value("New Title"));
  }

  @Test
  void getBySlug_Returns200AndPostDetail() throws Exception {
    UUID id = UUID.randomUUID();
    PostDetailResponse response = PostDetailResponse.builder().id(id).title("Title").build();
    
    when(postService.getBySlug("test-slug")).thenReturn(response);

    mockMvc.perform(get("/api/v1/posts/slug/{slug}", "test-slug"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(id.toString()));
  }

  @Test
  void getById_Returns200AndPostDetail() throws Exception {
    UUID id = UUID.randomUUID();
    PostDetailResponse response = PostDetailResponse.builder().id(id).title("Title").build();
    
    when(postService.getById(id)).thenReturn(response);

    mockMvc.perform(get("/api/v1/posts/{id}", id))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(id.toString()));
  }

  @Test
  void getAll_Returns200AndPage() throws Exception {
    UUID id = UUID.randomUUID();
    PostSummaryResponse summary = PostSummaryResponse.builder().id(id).title("Title").build();
    Page<PostSummaryResponse> page = new PageImpl<>(List.of(summary));
    
    when(postService.getAll(any(Pageable.class))).thenReturn(page);

    mockMvc.perform(get("/api/v1/posts"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[0].id").value(id.toString()));
  }

  @Test
  void delete_Returns204() throws Exception {
    UUID id = UUID.randomUUID();

    mockMvc.perform(delete("/api/v1/posts/{id}", id))
        .andExpect(status().isNoContent());
        
    verify(postService).delete(id);
  }
}
