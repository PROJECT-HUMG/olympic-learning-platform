package me.nghlong3004.olympic.api.learning.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import me.nghlong3004.olympic.api.common.exception.GlobalExceptionHandler;
import me.nghlong3004.olympic.api.common.exception.ResourceNotFoundException;
import me.nghlong3004.olympic.api.learning.dto.CreateObjectiveRequest;
import me.nghlong3004.olympic.api.learning.dto.ObjectiveResponse;
import me.nghlong3004.olympic.api.learning.dto.UpdateObjectiveRequest;
import me.nghlong3004.olympic.api.learning.service.ObjectiveService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
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
import static org.mockito.Mockito.doThrow;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice tests for {@link ObjectiveController}.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@WebMvcTest(ObjectiveController.class)
@Import({GlobalExceptionHandler.class, me.nghlong3004.olympic.api.config.TestSecurityConfig.class})
@DisplayName("ObjectiveController")
class ObjectiveControllerTest {

    @Autowired private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .findAndRegisterModules()
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    @MockitoBean private ObjectiveService objectiveService;

    private static final UUID TOPIC_ID = UUID.randomUUID();
    private static final UUID OBJECTIVE_ID = UUID.randomUUID();
    private static final ObjectiveResponse SAMPLE = new ObjectiveResponse(
            OBJECTIVE_ID, TOPIC_ID, "MATH-ALG-01", "Hiểu phép nhân ma trận", "UNDERSTAND", Instant.now()
    );

    @Nested
    @DisplayName("GET /api/v1/objectives?topicId=")
    class ListByTopic {

        @Test
        @DisplayName("should return objectives for authenticated user")
        void shouldListObjectives() throws Exception {
            given(objectiveService.findByTopic(TOPIC_ID)).willReturn(List.of(SAMPLE));

            mockMvc.perform(get("/api/v1/objectives").param("topicId", TOPIC_ID.toString())
                            .with(jwt()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].code").value("MATH-ALG-01"));
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void shouldRejectUnauthenticated() throws Exception {
            mockMvc.perform(get("/api/v1/objectives").param("topicId", TOPIC_ID.toString()))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/objectives/{id}")
    class GetById {

        @Test
        @DisplayName("should return objective by ID")
        void shouldReturnObjective() throws Exception {
            given(objectiveService.getByPublicId(OBJECTIVE_ID)).willReturn(SAMPLE);

            mockMvc.perform(get("/api/v1/objectives/{id}", OBJECTIVE_ID)
                            .with(jwt()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.bloomLevel").value("UNDERSTAND"));
        }

        @Test
        @DisplayName("should return 404 when not found")
        void shouldReturn404() throws Exception {
            UUID unknownId = UUID.randomUUID();
            given(objectiveService.getByPublicId(unknownId))
                    .willThrow(new ResourceNotFoundException("LearningObjective", unknownId));

            mockMvc.perform(get("/api/v1/objectives/{id}", unknownId)
                            .with(jwt()))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("POST /api/v1/objectives")
    class Create {

        @Test
        @DisplayName("should create objective for admin")
        void shouldCreateForAdmin() throws Exception {
            var request = new CreateObjectiveRequest(TOPIC_ID, "MATH-ALG-02", "Áp dụng", "APPLY");
            given(objectiveService.create(any(CreateObjectiveRequest.class))).willReturn(SAMPLE);

            mockMvc.perform(post("/api/v1/objectives")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("should return 400 for invalid Bloom level")
        void shouldRejectInvalidBloomLevel() throws Exception {
            var request = new CreateObjectiveRequest(TOPIC_ID, "CODE-01", "desc", "INVALID_LEVEL");
            mockMvc.perform(post("/api/v1/objectives")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 for blank code")
        void shouldRejectBlankCode() throws Exception {
            var request = new CreateObjectiveRequest(TOPIC_ID, "", "desc", "APPLY");
            mockMvc.perform(post("/api/v1/objectives")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 403 for non-admin")
        void shouldRejectNonAdmin() throws Exception {
            var request = new CreateObjectiveRequest(TOPIC_ID, "CODE", "desc", "APPLY");
            mockMvc.perform(post("/api/v1/objectives")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/objectives/{id}")
    class Update {

        @Test
        @DisplayName("should update objective for admin")
        void shouldUpdateForAdmin() throws Exception {
            var request = new UpdateObjectiveRequest("Mô tả mới", "ANALYZE");
            given(objectiveService.update(eq(OBJECTIVE_ID), any(UpdateObjectiveRequest.class))).willReturn(SAMPLE);

            mockMvc.perform(put("/api/v1/objectives/{id}", OBJECTIVE_ID)
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/objectives/{id}")
    class Delete {

        @Test
        @DisplayName("should delete objective for admin")
        void shouldDeleteForAdmin() throws Exception {
            doNothing().when(objectiveService).delete(OBJECTIVE_ID);

            mockMvc.perform(delete("/api/v1/objectives/{id}", OBJECTIVE_ID)
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("should return 404 when objective not found")
        void shouldReturn404() throws Exception {
            UUID unknownId = UUID.randomUUID();
            doThrow(new ResourceNotFoundException("LearningObjective", unknownId))
                    .when(objectiveService).delete(unknownId);

            mockMvc.perform(delete("/api/v1/objectives/{id}", unknownId)
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 403 for non-admin")
        void shouldRejectNonAdmin() throws Exception {
            mockMvc.perform(delete("/api/v1/objectives/{id}", OBJECTIVE_ID)
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                    .andExpect(status().isForbidden());
        }
    }
}
