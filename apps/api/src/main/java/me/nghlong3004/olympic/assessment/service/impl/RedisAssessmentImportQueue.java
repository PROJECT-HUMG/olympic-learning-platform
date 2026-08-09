package me.nghlong3004.olympic.assessment.service.impl;

import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.assessment.service.AssessmentImportProcessor;
import me.nghlong3004.olympic.assessment.service.AssessmentImportQueue;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.connection.stream.StreamReadOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Redis Streams implementation with a small polling consumer. The database remains the source of
 * truth, so a stream message can safely be retried or replayed.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RedisAssessmentImportQueue implements AssessmentImportQueue {

  private static final String STREAM_KEY = "olympic:assessment-imports";
  private static final String GROUP = "assessment-importers";
  private static final String CONSUMER = "api-worker";

  private final StringRedisTemplate redisTemplate;
  private final AssessmentImportProcessor processor;

  @PostConstruct
  void initializeGroup() {
    try {
      if (Boolean.TRUE.equals(redisTemplate.hasKey(STREAM_KEY))) {
        redisTemplate.opsForStream().createGroup(STREAM_KEY, ReadOffset.latest(), GROUP);
        return;
      }
      redisTemplate.opsForStream().add(
          StreamRecords.newRecord().in(STREAM_KEY).ofMap(Map.of("bootstrap", "true")));
      redisTemplate.opsForStream().createGroup(STREAM_KEY, ReadOffset.latest(), GROUP);
    } catch (Exception exception) {
      log.debug("Assessment import Redis group already exists or is unavailable");
    }
  }

  @Override
  public void enqueue(UUID importId) {
    redisTemplate.opsForStream().add(
        StreamRecords.newRecord().in(STREAM_KEY).ofMap(Map.of("importId", importId.toString())));
  }

  @Scheduled(fixedDelay = 1000)
  void consume() {
    List<MapRecord<String, Object, Object>> records;
    try {
      records = redisTemplate.opsForStream().read(
          Consumer.from(GROUP, CONSUMER),
          StreamReadOptions.empty().count(1).block(Duration.ofMillis(100)),
          StreamOffset.create(STREAM_KEY, ReadOffset.lastConsumed()));
    } catch (Exception exception) {
      log.warn("Assessment import queue is unavailable: reason={}", exception.getMessage());
      return;
    }
    if (records == null) {
      return;
    }
    records.forEach(record -> {
      try {
        if (record.getValue().containsKey("bootstrap")) {
          redisTemplate.opsForStream().acknowledge(STREAM_KEY, GROUP, record.getId());
          return;
        }
        var importId = UUID.fromString(String.valueOf(record.getValue().get("importId")));
        processor.process(importId);
        redisTemplate.opsForStream().acknowledge(STREAM_KEY, GROUP, record.getId());
      } catch (Exception exception) {
        log.error("Assessment import worker failed: recordId={}", record.getId(), exception);
      }
    });
  }
}
