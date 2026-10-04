package me.nghlong3004.olympic.user.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import java.net.URI;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.auth.mapper.AuthMapper;
import me.nghlong3004.olympic.common.properties.UserProperties;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.storage.dto.UploadedFile;
import me.nghlong3004.olympic.storage.entity.File;
import me.nghlong3004.olympic.storage.enums.StorageFolder;
import me.nghlong3004.olympic.storage.enums.StorageProvider;
import me.nghlong3004.olympic.storage.mapper.FileMapper;
import me.nghlong3004.olympic.storage.repository.FileRepository;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.user.entity.AvatarCrop;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.mapper.UserMapper;
import me.nghlong3004.olympic.user.repository.UserRepository;
import me.nghlong3004.olympic.user.request.UpdateAvatarCropRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
@ExtendWith(MockitoExtension.class)
class UserAvatarServiceTest {
  @Mock private UserRepository users;
  @Mock private CurrentUserProvider current;
  @Mock private StorageService storage;
  @Mock private FileRepository files;
  private final UserMapper mapper = Mappers.getMapper(UserMapper.class);
  private final FileMapper fileMapper = Mappers.getMapper(FileMapper.class);
  private UserAvatarServiceFixture fixture;
  private UserServiceImpl service;

  @BeforeEach
  void setUp() {
    var user = User.builder().id(UUID.randomUUID()).username("student").build();
    fixture = new UserAvatarServiceFixture(user);
    service =
        new UserServiceImpl(
            users, mapper, current, new UserProperties(null), storage, files, fileMapper);
  }

  private void authenticate() {
    when(current.getCurrentUser()).thenReturn(CurrentUser.builder().id(fixture.user().getId()).build());
    when(users.findForUpdateById(fixture.user().getId())).thenReturn(Optional.of(fixture.user()));
  }

  @Test
  void uploadsTheOriginalFileAndReturnsPersistedCrop() throws Exception {
    authenticate();
    var original = new MockMultipartFile("avatar", "portrait.jpg", "image/jpeg", new byte[] {1, 2, 3, 4});
    when(storage.upload(original, StorageFolder.AVATAR)).thenReturn(new UploadedFile(
        "avatar/original.jpg", original.getOriginalFilename(), original.getContentType(), original.getSize(),
        StorageProvider.CLOUDINARY, StorageFolder.AVATAR));
    when(files.save(any(File.class))).thenAnswer(call -> call.getArgument(0));
    when(storage.getDownloadUri("avatar/original.jpg")).thenReturn(URI.create("https://images.test/original.jpg"));

    var result = service.updateAvatar(original, new UpdateAvatarCropRequest(.2, .8, 2.0));

    verify(storage).upload(original, StorageFolder.AVATAR);
    assertThat(original.getBytes()).containsExactly(1, 2, 3, 4);
    assertThat(result.avatarUrl()).isEqualTo("https://images.test/original.jpg");
    assertThat(result.avatarCrop().x()).isEqualTo(.2);
    assertThat(result.avatarCrop().y()).isEqualTo(.8);
    assertThat(result.avatarCrop().zoom()).isEqualTo(2);
    var saved = fixture.user().getAvatar();
    assertThat(saved.getStorageKey()).isEqualTo("avatar/original.jpg");
    assertThat(saved.getOriginalName()).isEqualTo("portrait.jpg");
    assertThat(saved.getContentType()).isEqualTo("image/jpeg");
    assertThat(saved.getSize()).isEqualTo(4);
    assertThat(saved.getProvider()).isEqualTo(StorageProvider.CLOUDINARY);
    assertThat(saved.getFolder()).isEqualTo(StorageFolder.AVATAR);
  }

  @Test
  void reframesWithoutReplacingOrUploadingAnyFile() {
    authenticate();
    var original = File.builder().storageKey("avatar/original.jpg").build();
    fixture.user().setAvatar(original);
    when(storage.getDownloadUri(original.getStorageKey())).thenReturn(URI.create("https://images.test/original.jpg"));

    var result = service.updateAvatarCrop(new UpdateAvatarCropRequest(0.0, 1.0, 3.0));

    assertThat(fixture.user().getAvatar()).isSameAs(original);
    assertThat(result.avatarCrop().zoom()).isEqualTo(3);
    assertThat(result.avatarUrl()).isEqualTo("https://images.test/original.jpg");
    verifyNoInteractions(files);
    verify(storage).getDownloadUri(original.getStorageKey());
    verifyNoMoreInteractions(storage);
  }

  @Test
  void keepsExistingFileAndCropWhenUploadFails() {
    authenticate();
    var oldFile = File.builder().storageKey("avatar/original.jpg").build();
    var oldCrop = new AvatarCrop(.1, .2, 1.5);
    fixture.user().setAvatar(oldFile);
    fixture.user().setAvatarCrop(oldCrop);
    var original = new MockMultipartFile("avatar", "new.png", "image/png", new byte[] {1});
    when(storage.upload(original, StorageFolder.AVATAR)).thenThrow(new IllegalStateException("upload unavailable"));

    assertThatThrownBy(() -> service.updateAvatar(original, new UpdateAvatarCropRequest(.5, .5, 1.0)))
        .isInstanceOf(IllegalStateException.class);
    assertThat(fixture.user().getAvatar()).isSameAs(oldFile);
    assertThat(fixture.user().getAvatarCrop()).isSameAs(oldCrop);
    verifyNoInteractions(files);
    verify(storage).upload(original, StorageFolder.AVATAR);
    verifyNoMoreInteractions(storage);
  }

  @Test
  void nullUploadThrowsBeforeSave() {
    authenticate();
    var oldFile = File.builder().storageKey("avatar/original.jpg").build();
    var oldCrop = new AvatarCrop(.1, .2, 1.5);
    fixture.user().setAvatar(oldFile);
    fixture.user().setAvatarCrop(oldCrop);
    var original = new MockMultipartFile("avatar", "new.png", "image/png", new byte[] {1});
    when(storage.upload(original, StorageFolder.AVATAR)).thenReturn(null);

    assertThatThrownBy(() -> service.updateAvatar(original, new UpdateAvatarCropRequest(.5, .5, 1.0)))
        .isInstanceOf(NullPointerException.class);

    assertThat(fixture.user().getAvatar()).isSameAs(oldFile);
    assertThat(fixture.user().getAvatarCrop()).isSameAs(oldCrop);
    verify(storage).delete(oldFile.getStorageKey());
    verify(files).delete(oldFile);
    verify(files, never()).save(any());
  }

  @Test
  void removesCropWithAvatarAndMapsItInAuthResponses() {
    authenticate();
    fixture.user().setAvatarCrop(new AvatarCrop(.1, .2, 1.5));
    var auth = Mappers.getMapper(AuthMapper.class).toResponse(fixture.user()).withAvatarUrl("original.jpg");
    assertThat(auth.avatarCrop().zoom()).isEqualTo(1.5);
    service.removeAvatar();
    assertThat(fixture.user().getAvatarCrop()).isNull();
    verifyNoInteractions(storage, files);
  }

  private record UserAvatarServiceFixture(User user) {}
}
