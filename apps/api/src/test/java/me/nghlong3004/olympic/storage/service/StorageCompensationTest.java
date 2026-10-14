package me.nghlong3004.olympic.storage.service;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Outcome callback proof; unknown commit outcomes are simulated, not real network partitions.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/14/2026
 */
class StorageCompensationTest {
  private final StorageService storage = mock(StorageService.class);
  private final StorageCompensation compensation = new StorageCompensation(storage);

  @BeforeEach
  void begin() {
    TransactionSynchronizationManager.initSynchronization();
  }

  @AfterEach
  void end() {
    TransactionSynchronizationManager.clearSynchronization();
  }

  @Test
  void unknownCommitRetainsPossiblyReferencedBytes() {
    compensation.onRollback(List.of("synthetic/uncertain"));
    complete(TransactionSynchronization.STATUS_UNKNOWN);
    verify(storage, never()).delete("synthetic/uncertain");
  }

  @Test
  void successfulCommitRetainsReferencedBytes() {
    compensation.onRollback(List.of("synthetic/committed"));
    complete(TransactionSynchronization.STATUS_COMMITTED);
    verify(storage, never()).delete("synthetic/committed");
  }

  @Test
  void knownRollbackDeletesUnreferencedUpload() {
    compensation.onRollback(List.of("synthetic/rolled-back"));
    complete(TransactionSynchronization.STATUS_ROLLED_BACK);
    verify(storage).delete("synthetic/rolled-back");
  }

  private void complete(int status) {
    TransactionSynchronizationManager.getSynchronizations()
        .forEach(sync -> sync.afterCompletion(status));
  }
}
