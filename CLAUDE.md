# CLAUDE.md — Olympic Learning Platform

> **Mục đích**: File này cho bất kỳ AI agent nào đọc vào là hiểu project, bám theo conventions, và tiếp tục code mà không cần hỏi lại.

## 1. Project Overview

**Olympic Learning Platform** — hệ thống thi Olympic cho ĐH Mỏ - Địa chất (HUMG).
Spring Boot 4.0 modular monolith, PostgreSQL, JWT auth, RESTful API.

```
Root:     /home/nghlong3004/projects/olympic-learning-platform
Server:   ./server (Spring Boot 4.0.6, Java 21)
Base pkg: me.nghlong3004.olympic.api
```

## 2. Chạy project

```bash
# Docker (PostgreSQL + API)
docker compose up --build

# Hoặc chỉ DB, app chạy local
docker compose up -d db
cd server
export $(cat ../.env | grep -v '^#' | grep -v '^$' | xargs)
export DB_URL=jdbc:postgresql://localhost:5432/olympic_humg_dev
./mvnw spring-boot:run

# Chạy test
cd server && ./mvnw test
```

## 3. Package Structure (BẮT BUỘC)

Mỗi module theo pattern **module-based layered**:

```
me.nghlong3004.olympic.api.{module}/
├── controller/          # REST endpoints
├── dto/                 # Request + Response records
├── entity/              # JPA entities
├── mapper/              # MapStruct interfaces
├── repository/          # JPA repositories
├── service/             # Service interfaces
│   └── impl/            # Service implementations
└── enums/               # (nếu có)
```

**KHÔNG dùng**: `domain/`, `api/application/infrastructure/`, global `controller/service/` packages.

## 4. Modules Hiện Tại

| Module | Status | Gồm |
|--------|--------|-----|
| `common` | ✅ Done | BaseEntity, SoftDeletableEntity, exceptions, GlobalExceptionHandler |
| `config` | ✅ Done | SecurityConfig, JwtConfig, AuditConfig |
| `auth` | ✅ Done | AuthController, AuthService, JwtTokenService, RefreshToken |
| `user` | ✅ Done | UserController, UserService, User, Role, Permission |
| `learning` | ✅ Done | Subject, Topic, LearningObjective (CRUD + tests) |
| `content` | ❌ TODO | News, Announcement, LearningResource |
| `questionbank` | ❌ TODO | Question, QuestionOption, AnswerRule, review workflow |
| `assessment` | ❌ TODO | Practice, tests, attempts, grading |
| `campaign` | ❌ TODO | Olympiad campaigns, enrollment, selection |

## 5. Code Conventions (BẮT BUỘC tuân theo)

### Entity
- Kế thừa `BaseEntity` (id, publicId, createdAt, updatedAt)
- Soft delete → kế thừa `SoftDeletableEntity`
- Annotations: `@SuperBuilder`, `@NoArgsConstructor`, `@AllArgsConstructor`
- API trả về và nhận `publicId` (UUID), **KHÔNG** expose `id` (Long)

### DTO
- Dùng Java `record`
- Jakarta validation + message custom: `@NotBlank(message = "Email is required")`
- Swagger `@Schema` annotations

### Service
- Interface + impl pattern: `SubjectService` → `SubjectServiceImpl`
- `@Slf4j` trên mỗi impl
- Log bằng tiếng Anh, **KHÔNG log PII** (email, phone, password)
- Log format: `log.info("Subject created: publicId={}", subject.getPublicId())`

### Mapper
- MapStruct: `@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)`

### Repository
- `@Repository` annotation
- Extends `JpaRepository<Entity, Long>`
- Lookup methods dùng `publicId`: `Optional<Entity> findByPublicId(UUID publicId)`

### Controller
- `@RestController` + `@RequestMapping("/api/v1/{module}")`
- `@Valid` cho request body
- Admin endpoints: `@PreAuthorize("hasRole('ADMIN')")`
- Return `ResponseEntity<T>` (201 cho create, 204 cho void operations)
- Swagger: `@Tag`, `@Operation`, `@ApiResponse`

### Exception Handling
- `ResourceNotFoundException` → 404
- `DuplicateResourceException` → 409
- `BusinessRuleException` → 422
- `BadCredentialsException` → 401
- Validation errors → 400 (RFC 7807 ProblemDetail)

## 6. Security Architecture

```
Auth: JWT (HS256) via OAuth2 Resource Server
Access token: response body
Refresh token: HttpOnly secure cookie
```

**Public endpoints** (no auth required):
```
POST /api/v1/auth/login, /register, /refresh
GET  /api/v1/subjects/**, /news/**, /achievements
```

**Admin-only**: `@PreAuthorize("hasRole('ADMIN')")` trên method.

## 7. Testing Conventions (BẮT BUỘC)

**Spring Boot 4.0 khác biệt**:
- `@WebMvcTest` → import `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest`
- `@MockBean` → dùng `@MockitoBean` (from `spring-test`)
- `ObjectMapper` không auto-configure → tự tạo `new ObjectMapper().findAndRegisterModules()`
- Auth mock → dùng `jwt()` post-processor, **KHÔNG dùng** `@WithMockUser`

**Test structure**:
```java
@WebMvcTest(XxxController.class)
@Import({GlobalExceptionHandler.class, TestSecurityConfig.class})
class XxxControllerTest {
    @Autowired MockMvc mockMvc;
    @MockitoBean XxxService xxxService;
    ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    // Admin request
    mockMvc.perform(post("/api/v1/xxx")
        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
        .contentType(APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated());

    // Unauthenticated request
    mockMvc.perform(get("/api/v1/xxx"))
        .andExpect(status().isUnauthorized());

    // RBAC test
    mockMvc.perform(post("/api/v1/xxx")
        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
        .andExpect(status().isForbidden());
}
```

**Shared test config**: `TestSecurityConfig.java` — enables `@EnableMethodSecurity` + mock `JwtDecoder`.

**Test count hiện tại**: 117 tests, 0 failures.

## 8. Database

- PostgreSQL 17, Flyway migrations
- Schema: `server/src/main/resources/db/migration/V1__init_schema.sql` (671 lines)
- Pattern: dual-key (Long `id` internal, UUID `public_id` external)
- Soft delete: `deleted_at`, `deleted_by` columns

## 9. Config Files

| File | Mục đích |
|------|----------|
| `application.yaml` | Shared config (default profile: dev) |
| `application-dev.yaml` | Dev: localhost DB, debug logging |
| `application-prod.yaml` | Prod: no defaults, secure cookies |
| `docker-compose.yaml` | PostgreSQL + API containers |
| `.env.example` | Template env vars |
| `.env` | Local values (gitignored) |

## 10. Khi Tạo Module Mới

Checklist cho mỗi module (ví dụ: `content`):

1. **Entity** — kế thừa BaseEntity, `@SuperBuilder`, `@Repository` annotation
2. **Repository** — `findByPublicId`, custom queries nếu cần
3. **DTO** — request/response records, validation + message custom
4. **Mapper** — MapStruct, `unmappedTargetPolicy = IGNORE`
5. **Service** — interface + impl, `@Slf4j`, log tiếng Anh, no PII
6. **Controller** — REST, `@Valid`, `@PreAuthorize`, Swagger
7. **Tests** — Unit (ServiceImpl) + Slice (@WebMvcTest controller)
8. **Flyway** — Thêm migration file `V{N}__description.sql` nếu cần schema mới

## 11. Những Lỗi Hay Gặp

| Lỗi | Nguyên nhân | Fix |
|-----|-------------|-----|
| `@WebMvcTest` not found | SB 4.0 đổi package | `org.springframework.boot.webmvc.test.autoconfigure` |
| 403 thay vì 401 | Public GET pattern match `/subjects/**` | GET endpoints qua filter → `@PreAuthorize` trả 403 |
| `ObjectMapper` bean not found | SB 4.0 `@WebMvcTest` không auto-configure | Tự tạo `new ObjectMapper()` |
| `@WithMockUser` → 401/403 | OAuth2 Resource Server filter | Dùng `jwt()` post-processor |
| Test flaky 401/403 | Unauthenticated POST to admin endpoint | Assert `is4xxClientError()` |

## 12. Git Conventions

```
feat(module): short description
fix(module): what was fixed
test(module): what tests were added
chore: infrastructure/config changes
```
