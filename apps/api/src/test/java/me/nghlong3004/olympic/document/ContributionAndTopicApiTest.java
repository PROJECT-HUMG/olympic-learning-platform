package me.nghlong3004.olympic.document;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import me.nghlong3004.olympic.common.error.GlobalExceptionHandler;
import me.nghlong3004.olympic.common.properties.UserProperties;
import me.nghlong3004.olympic.common.security.BearerTokenConfig;
import me.nghlong3004.olympic.common.security.JwtCurrentUserAuthenticationConverter;
import me.nghlong3004.olympic.common.security.SecurityCurrentUserProvider;
import me.nghlong3004.olympic.common.security.SecurityFilterChainsConfig;
import me.nghlong3004.olympic.common.util.SlugGenerator;
import me.nghlong3004.olympic.document.controller.DocumentController;
import me.nghlong3004.olympic.document.entity.Document;
import me.nghlong3004.olympic.document.entity.DocumentCategory;
import me.nghlong3004.olympic.document.entity.Subject;
import me.nghlong3004.olympic.document.entity.Tag;
import me.nghlong3004.olympic.document.mapper.DocumentMapper;
import me.nghlong3004.olympic.document.repository.DocumentCategoryRepository;
import me.nghlong3004.olympic.document.repository.DocumentRepository;
import me.nghlong3004.olympic.document.repository.SubjectRepository;
import me.nghlong3004.olympic.document.repository.TagRepository;
import me.nghlong3004.olympic.document.response.DocumentResponse;
import me.nghlong3004.olympic.document.service.SearchTextNormalizer;
import me.nghlong3004.olympic.document.service.impl.DocumentServiceImpl;
import me.nghlong3004.olympic.storage.controller.StorageController;
import me.nghlong3004.olympic.storage.entity.File;
import me.nghlong3004.olympic.storage.enums.StorageFolder;
import me.nghlong3004.olympic.storage.repository.FileRepository;
import me.nghlong3004.olympic.storage.response.StorageUploadResponse;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.storage.service.StorageUploadService;
import me.nghlong3004.olympic.topic.controller.TopicController;
import me.nghlong3004.olympic.topic.entity.Topic;
import me.nghlong3004.olympic.topic.mapper.TopicMapper;
import me.nghlong3004.olympic.topic.repository.TopicRepository;
import me.nghlong3004.olympic.topic.service.impl.TopicServiceImpl;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.enums.Permission;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Real filter/method security and topic/document services; repositories and storage are synthetic.
 * This proves access/association behavior, not real provider/DB transaction or concurrency
 * behavior.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/16/2026
 */
@WebMvcTest({TopicController.class, DocumentController.class, StorageController.class})
@Import({
  SecurityFilterChainsConfig.class,
  BearerTokenConfig.class,
  JwtCurrentUserAuthenticationConverter.class,
  SecurityCurrentUserProvider.class,
  GlobalExceptionHandler.class,
  TopicServiceImpl.class,
  DocumentServiceImpl.class,
  ContributionAndTopicApiTest.Dependencies.class
})
@TestPropertySource(
    properties = {
      "spring.security.oauth2.client.registration.google.client-id=test",
      "spring.security.oauth2.client.registration.google.client-secret=test",
      "spring.security.oauth2.client.registration.github.client-id=test",
      "spring.security.oauth2.client.registration.github.client-secret=test",
      "logging.level.org.springframework.security=ERROR",
      "logging.level.me.nghlong3004.olympic=INFO"
    })
class ContributionAndTopicApiTest {
  private static final UUID ACTOR = UUID.randomUUID();
  private static final UUID SUBJECT = UUID.randomUUID();
  private static final UUID TOPIC = UUID.randomUUID();
  private static final UUID CATEGORY = UUID.randomUUID();
  private static final UUID TAG = UUID.randomUUID();
  private static final UUID FILE = UUID.randomUUID();
  private static final UUID DOCUMENT = UUID.randomUUID();
  @Autowired MockMvc mvc;
  @MockitoBean JwtDecoder decoder;
  @MockitoBean CorsConfigurationSource cors;
  @MockitoBean TopicRepository topics;
  @MockitoBean SubjectRepository subjects;
  @MockitoBean DocumentRepository documents;
  @MockitoBean DocumentCategoryRepository categories;
  @MockitoBean TagRepository tags;
  @MockitoBean FileRepository files;
  @MockitoBean UserRepository users;
  @MockitoBean StorageService storage;
  @MockitoBean StorageUploadService uploads;
  @MockitoBean DocumentMapper documentMapper;
  @MockitoBean SlugGenerator slugs;
  @MockitoBean SearchTextNormalizer normalizer;

  @BeforeEach
  void bearerTokens() {
    for (var role : Role.values()) {
      when(decoder.decode(role.name())).thenReturn(token(role, List.of()));
    }
    when(decoder.decode("contributor")).thenReturn(token(Role.STUDENT, List.of("DOCUMENT_UPLOAD")));
  }

  private Jwt token(Role role, List<String> permissions) {
    return Jwt.withTokenValue(role.name())
        .header("alg", "HS256")
        .subject(ACTOR.toString())
        .claim("email", "learner@example.invalid")
        .claim("username", "learner")
        .claim("full-name", "Learner")
        .claim("role", role.name())
        .claim("status", "ACTIVE")
        .claim("permissions", permissions)
        .build();
  }

  @Test
  void onlyAdminCanCreateOrDisableTopicAndInvalidNameIsRejected() throws Exception {
    var body = "{\"subjectId\":\"" + SUBJECT + "\",\"name\":\"Đại số\"}";
    mvc.perform(post("/api/v1/topics").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isUnauthorized());
    for (var role : new String[] {"STUDENT", "LECTURER"}) {
      mvc.perform(
              post("/api/v1/topics")
                  .header("Authorization", "Bearer " + role)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(body))
          .andExpect(status().isForbidden());
      mvc.perform(delete("/api/v1/topics/{id}", TOPIC).header("Authorization", "Bearer " + role))
          .andExpect(status().isForbidden());
    }
    mvc.perform(
            post("/api/v1/topics")
                .header("Authorization", "Bearer ADMIN")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body.replace("Đại số", "x".repeat(256))))
        .andExpect(status().isBadRequest());
    verifyNoInteractions(topics, subjects);
  }

  @Test
  void topicBelongsToSelectedEnabledSubjectAndDisableRetainsRecord() throws Exception {
    var subject = Subject.builder().id(SUBJECT).name("Toán học").enabled(true).build();
    when(subjects.findByIdAndEnabledTrue(SUBJECT)).thenReturn(Optional.of(subject));
    when(slugs.generate("Đại số")).thenReturn("dai-so");
    when(topics.save(any(Topic.class)))
        .thenAnswer(
            invocation -> {
              Topic value = invocation.getArgument(0);
              value.setId(TOPIC);
              return value;
            });
    mvc.perform(
            post("/api/v1/topics")
                .header("Authorization", "Bearer ADMIN")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"subjectId\":\"" + SUBJECT + "\",\"name\":\" Đại số \"}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.subjectId").value(SUBJECT.toString()))
        .andExpect(jsonPath("$.name").value("Đại số"));
    var value =
        Topic.builder()
            .id(TOPIC)
            .subject(subject)
            .name("Đại số")
            .slug("dai-so")
            .enabled(true)
            .build();
    when(topics.findAllBySubjectIdAndEnabledTrueOrderByNameAsc(SUBJECT)).thenReturn(List.of(value));
    mvc.perform(
            get("/api/v1/topics")
                .param("subjectId", SUBJECT.toString())
                .header("Authorization", "Bearer LECTURER"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(TOPIC.toString()));
    when(topics.findById(TOPIC)).thenReturn(Optional.of(value));
    mvc.perform(delete("/api/v1/topics/{id}", TOPIC).header("Authorization", "Bearer ADMIN"))
        .andExpect(status().isNoContent());
    assertThat(value.isEnabled()).isFalse();
    verifyNoInteractions(documents);
  }

  @Test
  void missingOrDisabledSubjectCannotReceiveNewTopic() throws Exception {
    mvc.perform(
            post("/api/v1/topics")
                .header("Authorization", "Bearer ADMIN")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"subjectId\":\"" + SUBJECT + "\",\"name\":\"Topic\"}"))
        .andExpect(status().isNotFound());
    verifyNoInteractions(topics);
  }

  private String documentBody() {
    return "{\"title\":\"Tài liệu\",\"description\":\"\",\"categoryId\":\""
        + CATEGORY
        + "\",\"subjectId\":\""
        + SUBJECT
        + "\",\"tagIds\":[\""
        + TAG
        + "\"],\"fileId\":\""
        + FILE
        + "\"}";
  }

  @Test
  void studentWithoutUploadPermissionCannotCreateDocumentOrUploadBytes() throws Exception {
    mvc.perform(
            post("/api/v1/documents")
                .header("Authorization", "Bearer STUDENT")
                .contentType(MediaType.APPLICATION_JSON)
                .content(documentBody()))
        .andExpect(status().isForbidden());
    mvc.perform(
            multipart("/api/v1/storage/upload")
                .file(
                    new MockMultipartFile("file", "fixture.pdf", "application/pdf", new byte[] {1}))
                .param("folder", "DOCUMENT")
                .header("Authorization", "Bearer STUDENT"))
        .andExpect(status().isForbidden());
    verifyNoInteractions(documents, files, uploads, users);
  }

  @Test
  void grantedStudentUploadsAndCreatesDocumentOwnedByAuthenticatedIdentity() throws Exception {
    when(uploads.upload(any(), eq(StorageFolder.DOCUMENT)))
        .thenReturn(new StorageUploadResponse(FILE, "https://example.invalid/fixture.pdf"));
    mvc.perform(
            multipart("/api/v1/storage/upload")
                .file(
                    new MockMultipartFile("file", "fixture.pdf", "application/pdf", new byte[] {1}))
                .param("folder", "DOCUMENT")
                .header("Authorization", "Bearer contributor"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").value(FILE.toString()));
    var user =
        User.builder()
            .id(ACTOR)
            .role(Role.STUDENT)
            .status(Status.ACTIVE)
            .permissions(Set.of(Permission.DOCUMENT_UPLOAD))
            .build();
    when(users.findByIdAndDeletedAtIsNull(ACTOR)).thenReturn(Optional.of(user));
    var file = File.builder().id(FILE).storageKey("documents/fixture.pdf").build();
    when(files.findById(FILE)).thenReturn(Optional.of(file));
    when(categories.findByIdAndEnabledTrue(CATEGORY))
        .thenReturn(Optional.of(new DocumentCategory()));
    when(subjects.findByIdAndEnabledTrue(SUBJECT)).thenReturn(Optional.of(new Subject()));
    when(tags.findAllByIdInAndEnabledTrue(Set.of(TAG))).thenReturn(List.of(new Tag()));
    when(slugs.generate("Tài liệu")).thenReturn("tai-lieu");
    when(documents.save(any(Document.class)))
        .thenAnswer(
            invocation -> {
              Document value = invocation.getArgument(0);
              value.setId(DOCUMENT);
              return value;
            });
    when(documentMapper.toResponse(any()))
        .thenReturn(DocumentResponse.builder().id(DOCUMENT).title("Tài liệu").build());
    when(storage.getDownloadUri("documents/fixture.pdf"))
        .thenReturn(URI.create("https://example.invalid/fixture.pdf"));
    mvc.perform(
            post("/api/v1/documents")
                .header("Authorization", "Bearer contributor")
                .contentType(MediaType.APPLICATION_JSON)
                .content(documentBody()))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").value(DOCUMENT.toString()));
    var captured = ArgumentCaptor.forClass(Document.class);
    verify(documents).save(captured.capture());
    assertThat(captured.getValue().getOwner().getId()).isEqualTo(ACTOR);
  }

  @Test
  void contributorCannotDeleteAnotherOwnersDocument() throws Exception {
    var other = User.builder().id(UUID.randomUUID()).role(Role.STUDENT).build();
    when(users.findByIdAndDeletedAtIsNull(ACTOR))
        .thenReturn(Optional.of(User.builder().id(ACTOR).role(Role.STUDENT).build()));
    var value = Document.builder().id(DOCUMENT).owner(other).build();
    when(documents.findForUpdateById(DOCUMENT)).thenReturn(Optional.of(value));
    mvc.perform(
            delete("/api/v1/documents/{id}", DOCUMENT)
                .header("Authorization", "Bearer contributor"))
        .andExpect(status().isForbidden());
    assertThat(value.getDeletedAt()).isNull();
  }

  @TestConfiguration
  static class Dependencies {
    @Bean
    TopicMapper topicMapper() {
      return Mappers.getMapper(TopicMapper.class);
    }

    @Bean
    UserProperties userProperties() {
      return new UserProperties(null);
    }
  }
}
