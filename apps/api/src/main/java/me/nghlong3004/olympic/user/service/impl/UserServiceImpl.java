package me.nghlong3004.olympic.user.service.impl;

import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.user.repository.UserRepository;
import me.nghlong3004.olympic.user.response.UserResponse;
import me.nghlong3004.olympic.user.service.UserService;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/15/2026
 */
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

  private final UserRepository userRepository;

  @Override
  public UserResponse getCurrentUser(String username) {
    return null;
  }
}
