package me.nghlong3004.olympic.auth.service.impl;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.auth.enums.AuthRefreshTokenStatus;
import me.nghlong3004.olympic.auth.repository.AuthRefreshTokenRepository;
import me.nghlong3004.olympic.auth.service.RefreshTokenCompromiseService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/18/2026
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenCompromiseServiceImpl implements RefreshTokenCompromiseService {

  private final AuthRefreshTokenRepository repository;
  private final Clock clock;

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  @Override
  public void revokeFamily(UUID familyId) {
    repository.revokeAllByFamilyIdAndStatus(
        familyId,
        AuthRefreshTokenStatus.ACTIVE,
        AuthRefreshTokenStatus.REVOKED,
        OffsetDateTime.now(clock));
  }
}
