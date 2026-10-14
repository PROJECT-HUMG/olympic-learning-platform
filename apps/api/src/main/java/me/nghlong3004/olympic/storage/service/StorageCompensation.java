package me.nghlong3004.olympic.storage.service;

import java.util.Collection;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Cleanup follows the actual transaction outcome, never an exception after a successful commit.
 * Unknown outcomes retain bytes: deleting a possibly committed reference would destroy data.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/14/2026
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StorageCompensation {
  private final StorageService storageService;

  public void onRollback(Collection<String> keys) {
    var snapshot = List.copyOf(keys);
    TransactionSynchronizationManager.registerSynchronization(
        new TransactionSynchronization() {
          @Override
          public void afterCompletion(int status) {
            if (status == STATUS_ROLLED_BACK) {
              deleteBestEffort(snapshot);
            } else if (status == STATUS_UNKNOWN) {
              log.error(
                  "File cleanup deferred: unknown transaction outcome, count={}", snapshot.size());
            }
          }
        });
  }

  public void afterCommit(Collection<String> keys) {
    var snapshot = List.copyOf(keys);
    TransactionSynchronizationManager.registerSynchronization(
        new TransactionSynchronization() {
          @Override
          public void afterCommit() {
            deleteBestEffort(snapshot);
          }
        });
  }

  public void deleteBestEffort(Collection<String> keys) {
    for (var key : keys) {
      try {
        storageService.delete(key);
      } catch (RuntimeException failure) {
        log.error("File compensation failed: storageKey={}", key, failure);
      }
    }
  }
}
