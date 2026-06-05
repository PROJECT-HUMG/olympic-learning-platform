package me.nghlong3004.olympic.api.learning.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import me.nghlong3004.olympic.api.common.exception.GlobalExceptionHandler;
import me.nghlong3004.olympic.api.common.exception.ResourceNotFoundException;
import me.nghlong3004.olympic.api.learning.dto.CreateSubjectRequest;
import me.nghlong3004.olympic.api.learning.dto.SubjectResponse;
import me.nghlong3004.olympic.api.learning.dto.UpdateSubjectRequest;
import me.nghlong3004.olympic.api.learning.service.SubjectService;
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
import static org.mockito.Mockito.doThrow;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice tests for {@link SubjectController}.
 *
 * <p>Uses {@code jwt()} post-processor for OAuth2 resource server compatibility.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@WebMvcTest(SubjectController.class)
@Import({GlobalExceptionHandler.class, me.nghlong3004.olympic.api.config.TestSecurityConfig.class})
@DisplayName("SubjectController")
class SubjectControllerTest {

    @Autowired private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .findAndRegisterModules()
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    @MockitoBean private SubjectService subjectService;

    private static final UUID SUBJECT_ID = UUID.randomUUID();
    private static final SubjectResponse SAMPLE = new SubjectResponse(
            SUBJECT_ID, "Toán học", "MATH", "Môn Toán", null, 0, true, Instant.now()
    );

    @Nested
    @DisplayName("GET /api/v1/subjects (public)")
    class ListActive {

        @Test
        @DisplayName("should return active subjects without authentication")
        void shouldListActivePublicly() throws Exception {
            given(subjectService.findAllActive(any(Pageable.class)))
                    .willReturn(new PageImpl<>(List.of(SAMPLE)));

            mockMvc.perform(get("/api/v1/subjects"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].code").value("MATH"));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/subjects/all")
    class ListAll {

        @Test
        @DisplayName("should return 403 without admin role (anonymous passes public GET filter)")
        void shouldRejectUnauthenticated() throws Exception {
            mockMvc.perform(get("/api/v1/subjects/all"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return all subjects for admin")
        void shouldListAllForAdmin() throws Exception {
            given(subjectService.findAll(any(Pageable.class)))
                    .willReturn(new PageImpl<>(List.of(SAMPLE)));

            mockMvc.perform(get("/api/v1/subjects/all")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray());
        }

        @Test
        @DisplayName("should return 403 for non-admin")
        void shouldRejectNonAdmin() throws Exception {
            mockMvc.perform(get("/api/v1/subjects/all")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/subjects/{id} (public)")
    class GetById {

        @Test
        @DisplayName("should return subject by ID without authentication")
        void shouldReturnSubject() throws Exception {
            given(subjectService.getByPublicId(SUBJECT_ID)).willReturn(SAMPLE);

            mockMvc.perform(get("/api/v1/subjects/{id}", SUBJECT_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Toán học"));
        }

        @Test
        @DisplayName("should return 404 when not found")
        void shouldReturn404() throws Exception {
            UUID unknownId = UUID.randomUUID();
            given(subjectService.getByPublicId(unknownId))
                    .willThrow(new ResourceNotFoundException("Subject", unknownId));

            mockMvc.perform(get("/api/v1/subjects/{id}", unknownId))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("POST /api/v1/subjects")
    class Create {

        @Test
        @DisplayName("should reject unauthenticated request")
        void shouldRejectUnauthenticated() throws Exception {
            var request = new CreateSubjectRequest("Lý", "PHYS", "desc", null);
            mockMvc.perform(post("/api/v1/subjects")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("should create subject for admin")
        void shouldCreateForAdmin() throws Exception {
            var request = new CreateSubjectRequest("Vật lý", "PHYS", "Môn Lý", null);
            var response = new SubjectResponse(UUID.randomUUID(), "Vật lý", "PHYS", "Môn Lý", null, 0, true, Instant.now());
            given(subjectService.create(any(CreateSubjectRequest.class))).willReturn(response);

            mockMvc.perform(post("/api/v1/subjects")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.code").value("PHYS"));
        }

        @Test
        @DisplayName("should return 400 for invalid request")
        void shouldRejectInvalidRequest() throws Exception {
            var request = new CreateSubjectRequest("", "", null, null);
            mockMvc.perform(post("/api/v1/subjects")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 403 for non-admin")
        void shouldRejectNonAdmin() throws Exception {
            var request = new CreateSubjectRequest("Lý", "PHYS", "desc", null);
            mockMvc.perform(post("/api/v1/subjects")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/subjects/{id}")
    class Update {

        @Test
        @DisplayName("should update subject for admin")
        void shouldUpdateForAdmin() throws Exception {
            var request = new UpdateSubjectRequest("Toán cao cấp", null, null, null);
            given(subjectService.update(eq(SUBJECT_ID), any(UpdateSubjectRequest.class))).willReturn(SAMPLE);

            mockMvc.perform(put("/api/v1/subjects/{id}", SUBJECT_ID)
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("PATCH /api/v1/subjects/{id}/toggle-active")
    class ToggleActive {

        @Test
        @DisplayName("should toggle active status for admin")
        void shouldToggleForAdmin() throws Exception {
            doNothing().when(subjectService).toggleActive(SUBJECT_ID);

            mockMvc.perform(patch("/api/v1/subjects/{id}/toggle-active", SUBJECT_ID)
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("should return 404 when subject not found")
        void shouldReturn404() throws Exception {
            UUID unknownId = UUID.randomUUID();
            doThrow(new ResourceNotFoundException("Subject", unknownId))
                    .when(subjectService).toggleActive(unknownId);

            mockMvc.perform(patch("/api/v1/subjects/{id}/toggle-active", unknownId)
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                    .andExpect(status().isNotFound());
        }
    }
}
