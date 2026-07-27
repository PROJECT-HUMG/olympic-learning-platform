package me.nghlong3004.olympic.user.seeder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminUserSeeder implements ApplicationRunner {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  @Value("${olympic.admin.email:}")
  private String adminEmail;

  @Value("${olympic.admin.username:admin}")
  private String adminUsername;

  @Value("${olympic.admin.password:}")
  private String adminPassword;

  @Value("${olympic.admin.full-name:Olympic Administrator}")
  private String adminFullName;

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    if (!StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
      log.info("Admin seed skipped because admin email or password is not configured");
      return;
    }

    if (adminPassword.length() < 8 || adminPassword.length() > 72) {
      log.warn("Admin seed skipped because password length is outside supported bounds");
      return;
    }

    String email = adminEmail.trim().toLowerCase();
    userRepository
        .findByEmailIgnoreCaseAndDeletedAtIsNull(email)
        .ifPresentOrElse(this::ensureAdmin, () -> createAdmin(email));
  }

  private void ensureAdmin(User user) {
    boolean changed = false;
    if (user.getRole() != Role.ADMIN) {
      user.setRole(Role.ADMIN);
      changed = true;
    }
    if (user.getStatus() != Status.ACTIVE) {
      user.setStatus(Status.ACTIVE);
      changed = true;
    }
    if (StringUtils.hasText(adminFullName)
        && !adminFullName.trim().equals(user.getFullName())) {
      user.setFullName(adminFullName.trim());
      changed = true;
    }
    if (StringUtils.hasText(adminUsername) && !adminUsername.trim().equals(user.getUsername())) {
      user.setUsername(adminUsername.trim());
      changed = true;
    }
    if (changed) {
      userRepository.save(user);
      log.info("Admin seed promoted/updated existing user {}", user.getId());
    }
  }

  private void createAdmin(String email) {
    User user =
        User.builder()
            .email(email)
            .username(resolveUsername(email))
            .passwordHash(passwordEncoder.encode(adminPassword))
            .fullName(resolveFullName(email))
            .role(Role.ADMIN)
            .status(Status.ACTIVE)
            .build();
    User saved = userRepository.save(user);
    log.info("Admin seed created user {}", saved.getId());
  }

  private String resolveFullName(String email) {
    if (StringUtils.hasText(adminFullName)) {
      return adminFullName.trim();
    }
    return email.substring(0, email.indexOf('@'));
  }

  private String resolveUsername(String email) {
    if (StringUtils.hasText(adminUsername)) {
      return adminUsername.trim();
    }
    return email.substring(0, email.indexOf('@'));
  }
}
