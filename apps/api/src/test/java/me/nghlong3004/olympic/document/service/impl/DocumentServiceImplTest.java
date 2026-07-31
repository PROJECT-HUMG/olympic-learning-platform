package me.nghlong3004.olympic.document.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import java.net.URI;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.document.entity.Document;
import me.nghlong3004.olympic.document.entity.DocumentCategory;
import me.nghlong3004.olympic.document.entity.Subject;
import me.nghlong3004.olympic.document.entity.Tag;
import me.nghlong3004.olympic.document.mapper.DocumentMapper;
import me.nghlong3004.olympic.document.repository.DocumentCategoryRepository;
import me.nghlong3004.olympic.document.repository.DocumentRepository;
import me.nghlong3004.olympic.document.repository.SubjectRepository;
import me.nghlong3004.olympic.document.repository.TagRepository;
import me.nghlong3004.olympic.document.request.CreateDocumentRequest;
import me.nghlong3004.olympic.document.response.CategorySummaryResponse;
import me.nghlong3004.olympic.document.response.DocumentResponse;
import me.nghlong3004.olympic.document.service.SearchTextNormalizer;
import me.nghlong3004.olympic.document.service.SlugGenerator;
import me.nghlong3004.olympic.storage.entity.File;
import me.nghlong3004.olympic.storage.repository.FileRepository;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DocumentServiceImplTest {

  @Mock private DocumentRepository documentRepository;
  @Mock private DocumentCategoryRepository categoryRepository;
  @Mock private SubjectRepository subjectRepository;
  @Mock private TagRepository tagRepository;
  @Mock private FileRepository fileRepository;
  @Mock private UserRepository userRepository;
  @Mock private StorageService storageService;
  @Mock private DocumentMapper documentMapper;
  @Mock private SlugGenerator slugGenerator;
  @Mock private SearchTextNormalizer searchTextNormalizer;
  @Mock private CurrentUserProvider currentUserProvider;

  @InjectMocks private DocumentServiceImpl documentService;

  private User adminUser;
  private User studentUser;
  private CurrentUser currentAdmin;
  
  @BeforeEach
  void setUp() {
    adminUser = new User();
    adminUser.setId(UUID.randomUUID());
    adminUser.setRole(Role.ADMIN);

    studentUser = new User();
    studentUser.setId(UUID.randomUUID());
    studentUser.setRole(Role.STUDENT);
    studentUser.setPermissions(Set.of());

    currentAdmin = new CurrentUser(adminUser.getId(), "admin@test.com", "Admin", null, Role.ADMIN, Status.ACTIVE, List.of());
  }

  @Test
  void create_shouldSucceed_whenUserIsAdmin() {
    UUID categoryId = UUID.randomUUID();
    UUID subjectId = UUID.randomUUID();
    UUID tagId = UUID.randomUUID();
    UUID fileId = UUID.randomUUID();

    CreateDocumentRequest request = new CreateDocumentRequest(
        "Title", "Desc", categoryId, subjectId, Set.of(tagId), fileId);

    when(currentUserProvider.getCurrentUser()).thenReturn(currentAdmin);
    when(userRepository.findByIdAndDeletedAtIsNull(adminUser.getId())).thenReturn(Optional.of(adminUser));
    
    File file = File.builder().id(fileId).storageKey("key").build();
    when(fileRepository.findById(fileId)).thenReturn(Optional.of(file));

    when(categoryRepository.findByIdAndEnabledTrue(categoryId)).thenReturn(Optional.of(new DocumentCategory()));
    when(subjectRepository.findByIdAndEnabledTrue(subjectId)).thenReturn(Optional.of(new Subject()));
    when(tagRepository.findAllByIdInAndEnabledTrue(Set.of(tagId))).thenReturn(List.of(new Tag()));
    
    when(slugGenerator.generate("Title")).thenReturn("title");
    when(searchTextNormalizer.normalize("Title", "Desc")).thenReturn("title desc");

    Document savedDocument = Document.builder().id(UUID.randomUUID()).file(file).build();
    when(documentRepository.save(any(Document.class))).thenReturn(savedDocument);

    DocumentResponse mappedResponse = new DocumentResponse(
        savedDocument.getId(), "Title", "title", "Desc", 0, 0, null, null, null, null, null, null, null, OffsetDateTime.now());
    when(documentMapper.toResponse(savedDocument)).thenReturn(mappedResponse);
    when(storageService.getDownloadUri(anyString())).thenReturn(URI.create("http://dl"));

    DocumentResponse result = documentService.create(request);

    assertThat(result.id()).isEqualTo(savedDocument.getId());
    assertThat(result.downloadUrl()).isEqualTo("http://dl");
    verify(documentRepository).save(any(Document.class));
  }


  @Test
  void getBySlug_shouldReturnDocument_whenExists() {
    String slug = "test-doc-slug";
    UUID id = UUID.randomUUID();
    Document document = new Document();
    document.setId(id);
    document.setSlug(slug);
    
    when(documentRepository.findBySlugAndDeletedAtIsNull(slug)).thenReturn(Optional.of(document));
    
    DocumentResponse response = DocumentResponse.builder()
        .id(id)
        .slug(slug)
        .build();
    when(documentMapper.toResponse(document)).thenReturn(response);

    DocumentResponse result = documentService.getBySlug(slug);

    assertThat(result.id()).isEqualTo(id);
    assertThat(result.slug()).isEqualTo(slug);
  }

  @Test
  void getDownloadUriBySlug_shouldReturnUri_whenDocumentExists() {
    String slug = "doc-to-download";
    UUID id = UUID.randomUUID();
    Document document = new Document();
    document.setId(id);
    document.setSlug(slug);
    me.nghlong3004.olympic.storage.entity.File file = new me.nghlong3004.olympic.storage.entity.File();
    file.setStorageKey("some/key");
    document.setFile(file);

    when(documentRepository.findBySlugAndDeletedAtIsNull(slug)).thenReturn(Optional.of(document));
    URI expectedUri = URI.create("https://example.com/download");
    when(storageService.getDownloadUri("some/key")).thenReturn(expectedUri);

    URI result = documentService.getDownloadUriBySlug(slug);

    assertThat(result).isEqualTo(expectedUri);
    assertThat(document.getDownloadCount()).isEqualTo(1);
  }

  @Test
  void getBySlug_shouldThrowException_whenNotFound() {
    String slug = "non-existent-slug";
    when(documentRepository.findBySlugAndDeletedAtIsNull(slug)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> documentService.getBySlug(slug))
        .isInstanceOf(me.nghlong3004.olympic.document.exception.DocumentNotFoundException.class)
        .hasMessageContaining("Document not found with slug");
  }

  @Test
  void delete_shouldSoftDelete_whenExists() {
    UUID id = UUID.randomUUID();
    Document document = Document.builder().id(id).build();
    when(documentRepository.findForUpdateById(id)).thenReturn(Optional.of(document));
    
    when(currentUserProvider.getCurrentUser()).thenReturn(currentAdmin);
    when(userRepository.findByIdAndDeletedAtIsNull(adminUser.getId())).thenReturn(Optional.of(adminUser));

    documentService.delete(id);

    assertThat(document.getDeletedAt()).isNotNull();
  }

  @Test
  void bulkDelete_shouldSucceed_whenUserIsAdmin() {
    List<UUID> ids = List.of(UUID.randomUUID(), UUID.randomUUID());
    when(currentUserProvider.getCurrentUser()).thenReturn(currentAdmin);
    when(documentRepository.softDeleteByIds(ids)).thenReturn(2);

    documentService.bulkDelete(ids);

    verify(documentRepository).softDeleteByIds(ids);
  }

  @Test
  void bulkDelete_shouldFail_whenUserIsNotAdmin() {
    List<UUID> ids = List.of(UUID.randomUUID(), UUID.randomUUID());
    CurrentUser currentStudent = new CurrentUser(studentUser.getId(), "student@test.com", "Student", null, Role.STUDENT, Status.ACTIVE, List.of());
    when(currentUserProvider.getCurrentUser()).thenReturn(currentStudent);

    assertThatThrownBy(() -> documentService.bulkDelete(ids))
        .isInstanceOf(ApiException.class)
        .hasMessageContaining("Admin permission required");
  }

  @Test
  void deleteByUserId_shouldSucceed_whenUserIsAdmin() {
    UUID targetUserId = UUID.randomUUID();
    when(currentUserProvider.getCurrentUser()).thenReturn(currentAdmin);
    when(documentRepository.softDeleteByOwnerId(targetUserId)).thenReturn(5);

    documentService.deleteByUserId(targetUserId);

    verify(documentRepository).softDeleteByOwnerId(targetUserId);
  }

  @Test
  void incrementViewCountBySlug_shouldCallRepository() {
    String slug = "viewed-doc";
    documentService.incrementViewCountBySlug(slug);
    verify(documentRepository).incrementViewCountBySlug(slug);
  }
}
