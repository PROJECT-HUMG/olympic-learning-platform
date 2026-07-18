package me.nghlong3004.olympic.auth.service;

import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/18/2026
 */
public interface RefreshTokenCompromiseService {
  /**
   * Revokes all refresh token when attacker claim refresh token.
   *
   * @param familyId family id for group refresh token
   */
  void revokeFamily(UUID familyId);
}
