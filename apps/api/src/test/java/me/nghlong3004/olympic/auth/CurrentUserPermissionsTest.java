package me.nghlong3004.olympic.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import me.nghlong3004.olympic.auth.mapper.AuthMapper;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.enums.Permission;
import me.nghlong3004.olympic.user.mapper.UserMapper;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

/**
 * Private session projections carry capability hints; public identity remains minimal.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/16/2026
 */
class CurrentUserPermissionsTest {
  @Test
  void loginAndMeMappersPreservePermissionsWithoutLeakingThemIntoPublicIdentity() {
    var permissions = new HashSet<>(Set.of(Permission.DOCUMENT_UPLOAD));
    var user = User.builder().id(UUID.randomUUID()).permissions(permissions).build();
    var mapper = Mappers.getMapper(UserMapper.class);
    var login = Mappers.getMapper(AuthMapper.class).toResponse(user);
    var me = mapper.toCurrentUserResponse(user).withAvatarUrl("https://example.invalid/avatar");
    permissions.clear();
    assertThat(login.permissions()).containsExactly(Permission.DOCUMENT_UPLOAD);
    assertThat(me.permissions()).containsExactly(Permission.DOCUMENT_UPLOAD);
    assertThat(mapper.toPublicResponse(user).getClass().getRecordComponents())
        .noneMatch(
            component ->
                List.of("permissions", "email", "status", "passwordHash")
                    .contains(component.getName()));
    assertThat(mapper.toCurrentUserResponse(User.builder().permissions(null).build()).permissions())
        .isEmpty();
  }
}
