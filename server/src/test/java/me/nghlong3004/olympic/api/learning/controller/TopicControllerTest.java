package me.nghlong3004.olympic.api.learning.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import me.nghlong3004.olympic.api.common.exception.GlobalExceptionHandler;
import me.nghlong3004.olympic.api.common.exception.ResourceNotFoundException;
import me.nghlong3004.olympic.api.learning.dto.CreateTopicRequest;
import me.nghlong3004.olympic.api.learning.dto.TopicResponse;
import me.nghlong3004.olympic.api.learning.dto.UpdateTopicRequest;
import me.nghlong3004.olympic.api.learning.service.TopicService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice tests for {@link TopicController}.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@WebMvcTest(TopicController.class)
@Import({GlobalExceptionHandler.class, me.nghlong3004.olympic.api.config.TestSecurityConfig.class})
@DisplayName("TopicController")
class TopicControllerTest {

    @Autowired private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .findAndRegisterModules()
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    @MockitoBean private TopicService topicService;

    private static final UUID SUBJECT_ID = UUID.randomUUID();
    private static final UUID TOPIC_ID = UUID.randomUUID();
    private static final TopicResponse SAMPLE = new TopicResponse(
            TOPIC_ID, SUBJECT_ID, null, "Đại số", "Chương Đại số", 0, true, Instant.now()
    );

    @Nested
    @DisplayName("GET /api/v1/topics?subjectId=")
    class ListBySubject {

        @Test
        @DisplayName("should return topics for authenticated user")
        void shouldListTopics() throws Exception {
            given(topicService.findBySubject(eq(SUBJECT_ID), any(Pageable.class)))
                    .willReturn(new PageImpl<>(List.of(SAMPLE)));

            mockMvc.perform(get("/api/v1/topics").param("subjectId", SUBJECT_ID.toString())
                            .with(jwt()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].name").value("Đại số"));
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void shouldRejectUnauthenticated() throws Exception {
            mockMvc.perform(get("/api/v1/topics").param("subjectId", SUBJECT_ID.toString()))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/topics/{id}")
    class GetById {

        @Test
        @DisplayName("should return topic by ID")
        void shouldReturnTopic() throws Exception {
            given(topicService.getByPublicId(TOPIC_ID)).willReturn(SAMPLE);

            mockMvc.perform(get("/api/v1/topics/{id}", TOPIC_ID)
                            .with(jwt()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Đại số"));
        }

        @Test
        @DisplayName("should return 404 when not found")
        void shouldReturn404() throws Exception {
            UUID unknownId = UUID.randomUUID();
            given(topicService.getByPublicId(unknownId))
                    .willThrow(new ResourceNotFoundException("Topic", unknownId));

            mockMvc.perform(get("/api/v1/topics/{id}", unknownId)
                            .with(jwt()))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("POST /api/v1/topics")
    class Create {

        @Test
        @DisplayName("should create topic for admin")
        void shouldCreateForAdmin() throws Exception {
            var request = new CreateTopicRequest(SUBJECT_ID, null, "Hình học", null);
            given(topicService.create(any(CreateTopicRequest.class))).willReturn(SAMPLE);

            mockMvc.perform(post("/api/v1/topics")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("should return 400 for blank name")
        void shouldRejectBlankName() throws Exception {
            var request = new CreateTopicRequest(SUBJECT_ID, null, "", null);
            mockMvc.perform(post("/api/v1/topics")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 403 for non-admin")
        void shouldRejectNonAdmin() throws Exception {
            var request = new CreateTopicRequest(SUBJECT_ID, null, "Topic", null);
            mockMvc.perform(post("/api/v1/topics")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/topics/{id}")
    class Update {

        @Test
        @DisplayName("should update topic for admin")
        void shouldUpdateForAdmin() throws Exception {
            var request = new UpdateTopicRequest("Đại số mới", null, null);
            given(topicService.update(eq(TOPIC_ID), any(UpdateTopicRequest.class))).willReturn(SAMPLE);

            mockMvc.perform(put("/api/v1/topics/{id}", TOPIC_ID)
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("PATCH /api/v1/topics/{id}/toggle-active")
    class ToggleActive {

        @Test
        @DisplayName("should toggle active status for admin")
        void shouldToggleForAdmin() throws Exception {
            doNothing().when(topicService).toggleActive(TOPIC_ID);

            mockMvc.perform(patch("/api/v1/topics/{id}/toggle-active", TOPIC_ID)
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                    .andExpect(status().isNoContent());
        }
    }
}
