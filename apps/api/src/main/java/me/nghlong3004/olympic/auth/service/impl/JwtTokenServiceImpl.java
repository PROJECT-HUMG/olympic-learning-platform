package me.nghlong3004.olympic.auth.service.impl;

import me.nghlong3004.olympic.auth.service.TokenService;
import me.nghlong3004.olympic.user.entity.User;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/15/2026
 */
public class JwtTokenServiceImpl implements TokenService {
  // add redis + jwt encoder
  @Override
  public String createAccessToken(User user) {
    return "";
  }

  @Override
  public String createRefreshToken(User user) {
    return "";
  }
}
