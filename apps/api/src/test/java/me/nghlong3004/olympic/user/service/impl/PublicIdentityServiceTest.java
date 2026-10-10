package me.nghlong3004.olympic.user.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import java.lang.reflect.RecordComponent;
import java.net.URI;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.entity.AvatarCrop;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;
import me.nghlong3004.olympic.user.mapper.UserMapper;
import me.nghlong3004.olympic.user.repository.UserRepository;
import me.nghlong3004.olympic.user.response.PublicUserIdentityResponse;
import me.nghlong3004.olympic.common.properties.UserProperties;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.storage.entity.File;
import me.nghlong3004.olympic.storage.repository.FileRepository;
import me.nghlong3004.olympic.storage.mapper.FileMapper;
import me.nghlong3004.olympic.storage.service.StorageService;
import org.junit.jupiter.api.Test;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/10/2026
 */
class PublicIdentityServiceTest {
  @Test
  void allActiveRolesHavePublicIdentityButDisabledPendingDeletedAccountsAndAccountDataDoNot() {
    var users = mock(UserRepository.class);
    var actor = mock(CurrentUserProvider.class);
    var storage = mock(StorageService.class);
    var service = new UserServiceImpl(users, mock(UserMapper.class), actor, mock(UserProperties.class),
        storage, mock(FileRepository.class), mock(FileMapper.class));
    var student = user(Role.STUDENT, Status.ACTIVE);
    student.setAvatar(File.builder().storageKey("avatars/test.png").build());
    student.setAvatarCrop(new AvatarCrop(.2, .8, 2.0));
    var lecturer = user(Role.LECTURER, Status.ACTIVE);
    var admin = user(Role.ADMIN, Status.ACTIVE);
    var disabled = user(Role.STUDENT, Status.DISABLED);
    var pending = user(Role.STUDENT, Status.PENDING);
    var deleted = user(Role.STUDENT, Status.ACTIVE);
    deleted.setDeletedAt(OffsetDateTime.now());
    var all = List.of(student, lecturer, admin, disabled, pending, deleted);
    var ids = all.stream().map(User::getId).toList();
    when(users.findAllById(ids)).thenReturn(all);
    when(storage.getDownloadUri("avatars/test.png")).thenReturn(URI.create("https://synthetic.invalid/avatar.png"));
    var result = service.publicIdentities(ids);
    assertThat(result.keySet()).containsExactlyInAnyOrder(student.getId(), lecturer.getId(), admin.getId());
    assertThat(result.get(student.getId()).avatarUrl()).isEqualTo("https://synthetic.invalid/avatar.png");
    assertThat(result.get(student.getId()).avatarCrop().zoom()).isEqualTo(2);
    assertThat(result.get(lecturer.getId()).avatarUrl()).isNull();
    assertThat(PublicUserIdentityResponse.class.getRecordComponents()).extracting(RecordComponent::getName)
        .containsExactly("id", "fullName", "username", "avatarUrl", "avatarCrop", "profileAvailable");
    verifyNoInteractions(actor);
    verify(users).findAllById(ids);
  }

  private User user(Role role, Status status) {
    return User.builder().id(UUID.randomUUID()).fullName("Synthetic member").username("member")
        .email("private@test.invalid").role(role).status(status).build();
  }
}
