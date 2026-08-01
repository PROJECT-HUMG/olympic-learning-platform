---
name: backend-java-style
description: >
  Authoritative coding-style reference for the Olympic Learning Platform Spring Boot 4.x backend.
  Covers project layout, file headers, entity design, DTO/request/response conventions, service
  interface + implementation split, logging strategy, controller patterns, error handling, mapper
  usage, repository conventions, configuration structure, and Swagger/OpenAPI annotations.
  Must be consulted before creating or modifying ANY Java file in apps/api.
---

# Olympic Backend — Java Coding Style Guide

> **Canonical reference files** are listed at the start of every section.
> Always cross-check these files before writing new code — the live source is the single source of truth.

---

## 1. Technology Stack

| Layer               | Technology                                         |
|---------------------|----------------------------------------------------|
| Language            | Java 25                                            |
| Framework           | Spring Boot 4.x (`spring-boot-starter-parent 4.0.7`) |
| Security            | Spring Security + OAuth2 Resource Server + JWT     |
| Database            | PostgreSQL                                         |
| ORM                 | Spring Data JPA / Hibernate                        |
| Migration           | Flyway                                             |
| Object Mapping      | MapStruct 1.6.x (with Lombok binding)              |
| Validation          | Jakarta Bean Validation (`spring-boot-starter-validation`) |
| API Docs            | springdoc-openapi (Swagger UI)                     |
| File Storage        | Cloudinary                                         |
| Caching / Sessions  | Redis (Spring Data Redis)                          |
| Build               | Maven                                              |
| Containerization    | Docker                                             |
| Code Generation     | Lombok (`@Slf4j`, `@RequiredArgsConstructor`, `@Builder`, etc.) |

> **Reference**: [pom.xml](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/pom.xml)

---

## 2. Project Layout (Package-by-Feature)

```
me.nghlong3004.olympic
├── auth/                       # Feature module
│   ├── controller/             # REST controllers
│   ├── dto/                    # Internal transfer objects (never exposed via API)
│   ├── entity/                 # JPA entities
│   ├── enums/                  # Domain enums
│   ├── mapper/                 # MapStruct mapper interfaces
│   ├── repository/             # Spring Data JPA repositories
│   ├── request/                # API request payloads (incoming)
│   ├── response/               # API response payloads (outgoing)
│   └── service/                # Service interfaces
│       └── impl/               # Service implementations
├── common/                     # Cross-cutting concerns (shared across modules)
│   ├── config/
│   ├── constant/
│   ├── error/                  # ApiException, ErrorCode, GlobalExceptionHandler, FieldViolation
│   ├── filter/
│   ├── mail/
│   ├── properties/
│   ├── security/
│   └── util/
├── document/
├── storage/
├── user/
└── admin/
```

### Rules

- **Package-by-feature, not package-by-layer.** Each domain module (`auth`, `user`, `document`, …) owns its own `controller`, `entity`, `service`, etc.
- **`common/`** holds infrastructure that is genuinely shared (error handling, security config, properties, mail, filters).
- **Never create a top-level `dto/` or `service/` package.** They must live inside the feature module.

> **Reference**: project directory listing at `apps/api/src/main/java/me/nghlong3004/olympic/`

---

## 3. Fully Qualified Class Name (FQCN) Conventions

Every class name in the project follows a deterministic pattern based on its **module** and **role**. Given a module name (e.g., `auth`, `user`, `document`), you can derive the FQCN for any class type.

### 3.1 Base Package

```
me.nghlong3004.olympic.<module>
```

### 3.2 Naming Table

| Role               | Package Suffix       | Class Name Pattern                | FQCN Example (`auth` module)                                                  |
|--------------------|----------------------|-----------------------------------|--------------------------------------------------------------------------------|
| **Entity**         | `.entity`            | `<Domain>`                        | `me.nghlong3004.olympic.auth.entity.AuthEmailToken`                            |
| **Enum**           | `.enums`             | `<Domain><Concept>`               | `me.nghlong3004.olympic.auth.enums.AuthEmailTokenPurpose`                      |
| **Repository**     | `.repository`        | `<Domain>Repository`              | `me.nghlong3004.olympic.auth.repository.AuthEmailTokenRepository`              |
| **Service (I)**    | `.service`           | `<Domain>Service`                 | `me.nghlong3004.olympic.auth.service.AuthService`                              |
| **Service (Impl)** | `.service.impl`      | `<Domain>ServiceImpl`             | `me.nghlong3004.olympic.auth.service.impl.AuthServiceImpl`                     |
| **Controller**     | `.controller`        | `<Domain>Controller`              | `me.nghlong3004.olympic.auth.controller.AuthController`                        |
| **Mapper**         | `.mapper`            | `<Domain>Mapper`                  | `me.nghlong3004.olympic.auth.mapper.AuthMapper`                                |
| **Request**        | `.request`           | `<Action>Request`                 | `me.nghlong3004.olympic.auth.request.LoginRequest`                             |
| **Response**       | `.response`          | `<Action>Response`                | `me.nghlong3004.olympic.auth.response.LoginResponse`                           |
| **DTO**            | `.dto`               | `<Domain><Purpose>`               | `me.nghlong3004.olympic.auth.dto.AuthEmailTokenConsumption`                    |

### 3.3 Common Module Classes (cross-cutting)

Classes in `common/` use a role-based subpackage instead of a domain module:

| Role               | Package                                 | Class Name Pattern                | FQCN Example                                                                    |
|--------------------|-----------------------------------------|-----------------------------------|---------------------------------------------------------------------------------|
| **Exception**      | `common.error`                          | `ApiException`                    | `me.nghlong3004.olympic.common.error.ApiException`                              |
| **Error Enum**     | `common.error`                          | `ErrorCode`                       | `me.nghlong3004.olympic.common.error.ErrorCode`                                 |
| **Exception Handler** | `common.error`                       | `GlobalExceptionHandler`          | `me.nghlong3004.olympic.common.error.GlobalExceptionHandler`                    |
| **Validation DTO** | `common.error`                          | `FieldViolation`                  | `me.nghlong3004.olympic.common.error.FieldViolation`                            |
| **Security Config**| `common.security`                       | `SecurityChainsConfig`            | `me.nghlong3004.olympic.common.security.SecurityChainsConfig`                   |
| **Properties**     | `common.properties`                     | `<Concern>Properties`             | `me.nghlong3004.olympic.common.properties.SecurityProperties`                   |
| **Filter**         | `common.filter`                         | `<Purpose>Filter`                 | `me.nghlong3004.olympic.common.filter.RequestTraceFilter`                       |
| **Constants**      | `common.constant`                       | `<Domain>Constant`                | `me.nghlong3004.olympic.common.constant.MessageConstant`                        |
| **Utility**        | `common.util`                           | `<Purpose>Builder` / `<Purpose>Util` | `me.nghlong3004.olympic.common.util.AuthLinkBuilder`                         |
| **Config**         | `common.config`                         | `<Concern>Config`                 | `me.nghlong3004.olympic.common.config.JacksonConfig`                            |
| **Mail Model**     | `common.mail.model`                     | `<Purpose>MailModel`              | `me.nghlong3004.olympic.common.mail.model.EmailVerificationMailModel`           |
| **Mail Event**     | `common.mail.event`                     | `MailSendEvent`                   | `me.nghlong3004.olympic.common.mail.event.MailSendEvent`                        |

### 3.4 Naming Rules

1. **Entity names do NOT have an `Entity` suffix** — just the domain noun: `User`, `AuthEmailToken`, `Document`.
2. **Service interfaces omit `I` prefix** — use `AuthService`, not `IAuthService`.
3. **Service implementations always suffix with `Impl`** — `AuthServiceImpl`.
4. **Request/Response names are action-driven** — `LoginRequest`, `RegisterResponse`, `ForgotPasswordRequest`.
5. **DTOs describe their content/purpose** — `AuthEmailTokenConsumption`, `RefreshTokenIssue`.
6. **Enums use the domain + concept** — `AuthEmailTokenPurpose`, `AuthEmailTokenStatus`, `Status`, `Role`.
7. **Mapper names match their primary source entity's module** — `AuthMapper` maps `User → CurrentUserResponse` but lives in `auth.mapper` because it serves the auth module.

### 3.5 Import Style

```java
// ✅ Explicit imports (preferred)
import me.nghlong3004.olympic.auth.request.LoginRequest;
import me.nghlong3004.olympic.auth.request.RegisterRequest;

// ✅ Wildcard imports (allowed ONLY for same-module request/response packages)
import me.nghlong3004.olympic.auth.request.*;
import me.nghlong3004.olympic.auth.response.*;

// ✅ Static imports for constants
import static me.nghlong3004.olympic.common.constant.MessageConstant.*;

// ❌ Never wildcard-import across modules
import me.nghlong3004.olympic.user.entity.*;   // ← WRONG from auth module
```

### 3.6 No Inline FQCN — Always Import

**CRITICAL**: Never use fully qualified class names inline in the code body. Every type reference must be imported at the top of the file and used by its simple name.

```java
// ❌ WRONG — inline FQCN in code body
var category = me.nghlong3004.olympic.document.entity.DocumentCategory.builder()
    .name("Math")
    .build();
me.nghlong3004.olympic.common.error.ErrorCode.RESOURCE_NOT_FOUND.throwIt();

// ✅ CORRECT — import at top, use simple name in body
import me.nghlong3004.olympic.document.entity.DocumentCategory;
import me.nghlong3004.olympic.common.error.ErrorCode;

// ... in method body:
var category = DocumentCategory.builder()
    .name("Math")
    .build();
throw ErrorCode.RESOURCE_NOT_FOUND.throwIt();
```

This applies to **all** types: entities, enums, exceptions, DTOs, responses, requests, utilities, etc. The only place a FQCN may appear is inside an `import` statement.

> **Reference**: All class names derived from the live codebase at `apps/api/src/main/java/me/nghlong3004/olympic/`

---

## 4. File Header (Author & Since)

Every new Java file **must** start with a Javadoc block immediately before the class/interface/enum/record declaration:

```java
/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since M/dd/yyyy
 */
```

- `@since` uses the **creation date** of the file in `M/dd/yyyy` format (US locale, no leading zeros on month).
- The author tag uses the format `handle (Full Name)`.

> **Reference**: [AuthEmailTokenPurpose.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/auth/enums/AuthEmailTokenPurpose.java) (lines 3-6),
> [LoginRequest.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/auth/request/LoginRequest.java) (lines 6-9)

---

## 5. Entity Design

> **Reference**: [AuthEmailToken.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/auth/entity/AuthEmailToken.java)

### 5.1 Class-Level Annotations (in this order)

```java
@Entity
@Table(name = "table_name")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntityName { ... }
```

### 5.2 Primary Key

- Always `UUID`, generated by Hibernate:
  ```java
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;
  ```

### 5.3 Column Mapping

- Use explicit `@Column(name = "snake_case", nullable = ...)` on every field.
- For PostgreSQL native enums, combine:
  ```java
  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(nullable = false)
  private SomeEnum status;
  ```

### 5.4 Temporal Fields

- Use `OffsetDateTime` (never `LocalDateTime`).
- Common audit fields: `issuedAt`, `expiresAt`, `usedAt`, `revokedAt`, `createdAt`, `updatedAt`, `lastLoginAt`.

### 5.5 No Business Logic in Entities — Exception

- Simple guard methods that throw domain exceptions are acceptable inside entities (e.g., `user.requireActiveForAuth()`, `user.requireNotDisabled()`).
- Complex orchestration logic belongs in services.

---

## 6. Enum Design

> **Reference**: [AuthEmailTokenPurpose.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/auth/enums/AuthEmailTokenPurpose.java)

```java
/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/16/2026
 */
public enum AuthEmailTokenPurpose {
  EMAIL_VERIFICATION,
  PASSWORD_RESET,
  ADMIN_INVITE
}
```

- **SCREAMING_SNAKE_CASE** for constants.
- No constructor arguments unless genuinely needed.
- Placed in `<module>/enums/` package.

---

## 7. DTO (Internal Transfer Objects)

> **Reference**: [AuthEmailTokenConsumption.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/auth/dto/AuthEmailTokenConsumption.java)

```java
public record AuthEmailTokenConsumption(User user, AuthEmailTokenPurpose purpose) {}
```

- Use Java `record` for immutability and conciseness.
- DTOs live in `<module>/dto/`.
- DTOs are for **internal** service-to-service data transfer — never used as API payloads.
- Inline records inside service interfaces are also acceptable for tightly-coupled result pairs:
  ```java
  record LoginResult(LoginResponse response, RefreshTokenIssue refreshToken) {}
  ```

> **Reference**: [AuthService.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/auth/service/AuthService.java) (lines 87-89)

---

## 8. Request Payloads

> **Reference**: [LoginRequest.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/auth/request/LoginRequest.java),
> [RegisterRequest.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/auth/request/RegisterRequest.java)

### 8.1 Format

```java
public record LoginRequest(
    @Schema(example = "admin@nghlong3004.me hoặc admin")
        @NotBlank(message = "Tên đăng nhập hoặc Email không được để trống")
        String identifier,
    @Schema(example = "change-me")
        @NotBlank(message = "Password is required")
        String password) {}
```

### 8.2 Rules

| Concern             | Convention                                                                                     |
|----------------------|-----------------------------------------------------------------------------------------------|
| **Type**            | Java `record`                                                                                 |
| **Package**         | `<module>/request/`                                                                           |
| **Validation**      | Jakarta Bean Validation annotations directly on record components                              |
| **Swagger**         | `@Schema(description = "...", example = "...")` on each field for OpenAPI docs                 |
| **Messages**        | Human-readable validation messages; can be Vietnamese or English depending on user-facing text |
| **Naming**          | `<Action>Request` (e.g., `RegisterRequest`, `LoginRequest`, `ForgotPasswordRequest`)          |

---

## 9. Response Payloads

> **Reference**: [AuthMessageResponse.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/auth/response/AuthMessageResponse.java),
> [RegisterResponse.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/auth/response/RegisterResponse.java),
> [LoginResponse.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/auth/response/LoginResponse.java)

### 9.1 Format

```java
public record AuthMessageResponse(
    @Schema(example = "Request accepted") String message,
    @Schema(example = "success.auth") String messageKey) {}
```

### 9.2 Rules

| Concern       | Convention                                                                  |
|---------------|-----------------------------------------------------------------------------|
| **Type**      | Java `record`                                                               |
| **Package**   | `<module>/response/`                                                        |
| **Swagger**   | `@Schema(example = "...")` on fields that benefit from documentation        |
| **Naming**    | `<Action>Response` or `<Domain>MessageResponse`                             |
| **Pattern**   | Generic message responses carry both `message` (human) and `messageKey` (i18n key) |

---

## 10. Service Layer (Interface + Implementation Split)

### 10.1 Service Interface

> **Reference**: [AuthService.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/auth/service/AuthService.java)

```java
public interface AuthService {

  /**
   * Registers a local user when self-registration is enabled. The created account remains pending
   * until the verification email token is consumed.
   *
   * @param request validated registration payload
   * @param ip client IP address for email-token audit metadata
   * @param userAgent client user-agent for email-token audit metadata
   * @return pending account response
   */
  RegisterResponse register(RegisterRequest request, String ip, String userAgent);

  // ... other methods

  record LoginResult(LoginResponse response, RefreshTokenIssue refreshToken) {}
}
```

**Rules:**

- Lives in `<module>/service/`.
- **Every public method has a full Javadoc** with `@param` and `@return`.
- Javadoc describes behavior, edge cases, and security considerations (e.g., "The implementation must never log the plaintext password").
- Result-pair records for methods that return multiple values can be declared inline inside the interface.
- No `@Service` or `@Transactional` annotations on the interface.

### 10.2 Service Implementation

> **Reference**: [AuthServiceImpl.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/auth/service/impl/AuthServiceImpl.java)

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  // ... other dependencies injected via constructor

  @Transactional
  @Override
  public RegisterResponse register(RegisterRequest request, String ip, String userAgent) {
    // ... implementation
    log.info("User registration accepted: userId={}", user.getId());
    return new RegisterResponse(REGISTRATION_SUCCESS_MESSAGE, REGISTRATION_SUCCESS_MESSAGE_KEY);
  }
}
```

**Rules:**

| Concern              | Convention                                                                                                   |
|----------------------|--------------------------------------------------------------------------------------------------------------|
| **Package**          | `<module>/service/impl/`                                                                                     |
| **Annotations**      | `@Slf4j`, `@Service`, `@RequiredArgsConstructor` (in this order)                                             |
| **DI**               | Constructor injection via `@RequiredArgsConstructor` — **no `@Autowired`**                                   |
| **Transactions**     | `@Transactional` on methods that write data, placed before `@Override`                                        |
| **No Javadoc**       | Implementation class methods do NOT repeat Javadoc from the interface                                         |
| **Logging**          | Use `@Slf4j` (Lombok); log at `info` level for meaningful state transitions; log at `error`/`warn` for failures |

---

## 11. Logging Strategy

> **Reference**: [AuthServiceImpl.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/auth/service/impl/AuthServiceImpl.java)

### 11.1 When to Log

| Scenario                         | Level   | Example                                                        |
|----------------------------------|---------|----------------------------------------------------------------|
| Successful state transition      | `INFO`  | `log.info("User registration accepted: userId={}", user.getId())` |
| Business-rule rejection          | `WARN`  | `log.warn("Login failed: user disabled, userId={}", user.getId())` |
| Unexpected / infrastructure error| `ERROR` | `log.error("Unexpected error occurred", exception)`             |
| Debugging internals              | `DEBUG` | Sparingly, never in production-hot paths                        |

### 11.2 When NOT to Log

- Do **not** log sensitive data (passwords, tokens, PII).
- Do **not** log every method entry/exit — only meaningful business events.
- Do **not** duplicate log messages that `GlobalExceptionHandler` already covers.

### 11.3 Log Format

```java
log.info("User password updated: userId={}, purpose={}", user.getId(), purpose);
```

- Structured key-value pairs inside the message string.
- Always include the entity ID for traceability.
- The logging pattern includes `traceId` via MDC (configured in `application.yaml`):
  ```yaml
  logging:
    pattern:
      level: "%5p [traceId=%X{traceId:-}]"
  ```

### 11.4 Annotation

- Use `@Slf4j` from Lombok — never manually declare a logger.

---

## 12. Controller Layer

> **Reference**: [AuthController.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/auth/controller/AuthController.java)

### 12.1 Class-Level Annotations

```java
@RestController
@RequestMapping("/api/v1/<module>")
@RequiredArgsConstructor
@Tag(name = "Module Name", description = "Brief description of module APIs")
public class ModuleController { ... }
```

### 12.2 Method-Level Annotations

```java
@PostMapping("/register")
@Operation(summary = "Register a local account when self-registration is enabled")
@ApiResponse(responseCode = "200", description = "Registration accepted and verification email sent")
@ApiResponse(responseCode = "403", description = "Self-registration is disabled")
@ApiResponse(responseCode = "409", description = "Email already exists")
public RegisterResponse register(
    @Valid @RequestBody RegisterRequest request, HttpServletRequest servletRequest) {
  return authService.register(
      request, servletRequest.getRemoteAddr(), servletRequest.getHeader(HttpHeaders.USER_AGENT));
}
```

### 12.3 Rules

| Concern               | Convention                                                                          |
|-----------------------|-------------------------------------------------------------------------------------|
| **URL Prefix**        | `/api/v1/<module>` — versioned                                                     |
| **Swagger**           | `@Tag` on class; `@Operation(summary=)` + `@ApiResponse` on every endpoint         |
| **Validation**        | `@Valid @RequestBody` on request parameters                                         |
| **Return Type**       | Direct response record for simple cases; `ResponseEntity<T>` when headers/cookies are needed |
| **No Business Logic** | Controller only delegates to service; no conditionals beyond cookie extraction      |
| **Private Helpers**   | Cookie handling, link building — thin utility methods only                           |

---

## 13. Error Handling

### 13.1 ErrorCode Enum

> **Reference**: [ErrorCode.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/common/error/ErrorCode.java)

```java
@Getter
@RequiredArgsConstructor
public enum ErrorCode {
  VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Validation failed", "error.validation"),
  AUTHENTICATION_REQUIRED(HttpStatus.UNAUTHORIZED, "Authentication is required", "error.auth.required"),
  // ...
  INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Internal error", "error.internal");

  private final HttpStatus status;
  private final String defaultDetail;
  private final String messageKey;

  public ApiException throwIt() { return new ApiException(this); }
  public ApiException throwIt(String detail) { return new ApiException(this, detail); }
}
```

- Every error has: `HttpStatus`, `defaultDetail` (human message), `messageKey` (i18n key).
- Throw via `ErrorCode.SOME_CODE.throwIt()` — never instantiate `ApiException` directly.

### 13.2 ApiException

> **Reference**: [ApiException.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/common/error/ApiException.java)

- Extends `RuntimeException`.
- Carries the `ErrorCode` reference for the handler to map.

### 13.3 GlobalExceptionHandler

> **Reference**: [GlobalExceptionHandler.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/common/error/GlobalExceptionHandler.java)

- `@RestControllerAdvice`
- Returns RFC 9457 `ProblemDetail` objects.
- Each `ProblemDetail` includes:
  - `type`: `https://olympic.nghlong3004.me/problems/<error-code-kebab>`
  - `code`: `ErrorCode.name()` (SCREAMING_SNAKE)
  - `messageKey`: i18n key
  - `traceId`: from MDC
  - `fieldErrors`: (validation only) list of `FieldViolation` records
- Catches: `ApiException`, `UserPendingException`, `UserDisabledException`, `MethodArgumentNotValidException`, `ConstraintViolationException`, `DataIntegrityViolationException`, `AccessDeniedException`, `AuthenticationException`, `MaxUploadSizeExceededException`, and a catch-all `Exception`.

---

## 14. MapStruct Mappers

> **Reference**: [AuthMapper.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/auth/mapper/AuthMapper.java)

```java
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AuthMapper {

  @Mapping(target = "avatarUrl", ignore = true)
  CurrentUserResponse toResponse(User user);
}
```

- Always `componentModel = "spring"`.
- Always `unmappedTargetPolicy = ReportingPolicy.IGNORE`.
- Use `@Mapping(target = ..., ignore = true)` for fields set manually after mapping.
- Package: `<module>/mapper/`.

---

## 15. Repository Layer

> **Reference**: [AuthEmailTokenRepository.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/auth/repository/AuthEmailTokenRepository.java)

```java
@Repository
public interface AuthEmailTokenRepository extends JpaRepository<AuthEmailToken, UUID> {

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("""
      select token
      from AuthEmailToken token
      where token.tokenHash = :tokenHash
        and token.status = :status
      """)
  Optional<AuthEmailToken> findForUpdateByTokenHashAndStatus(
      @Param("tokenHash") String tokenHash, @Param("status") AuthEmailTokenStatus status);

  @Modifying
  @Query("""
      UPDATE AuthEmailToken t
      SET t.status = :newStatus, t.revokedAt = :now
      WHERE t.userId = :userId AND t.status = :currentStatus
      """)
  void revokeAllByUserIdAndStatus(
      UUID userId, AuthEmailTokenStatus currentStatus,
      AuthEmailTokenStatus newStatus, OffsetDateTime now);
}
```

### Rules

| Concern              | Convention                                                                  |
|----------------------|-----------------------------------------------------------------------------|
| **Annotation**       | `@Repository` on the interface                                              |
| **Extends**          | `JpaRepository<Entity, UUID>`                                               |
| **Naming**           | `findBy...`, `findForUpdateBy...` (pessimistic lock), `revokeAllBy...`      |
| **JPQL**             | Multi-line text blocks for readability                                      |
| **Locking**          | `@Lock(LockModeType.PESSIMISTIC_WRITE)` for concurrent-safe lookups         |
| **Bulk Updates**     | `@Modifying` + `@Query` — return `void` when no result is needed            |
| **Parameters**       | `@Param("name")` for JPQL named parameters                                 |

---

## 16. Configuration & Profiles

> **Reference**: [application.yaml](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/resources/application.yaml),
> [application-dev.yaml](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/resources/application-dev.yaml),
> [application-prod.yaml](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/resources/application-prod.yaml)

| File                    | Purpose                                                 |
|-------------------------|---------------------------------------------------------|
| `application.yaml`      | Shared defaults, profile selection, business properties |
| `application-dev.yaml`  | Development overrides (local DB, debug logging, Mailhog)|
| `application-prod.yaml` | Production overrides (HikariCP tuning, strict security) |

### Custom Namespace

All custom properties are under `olympic:` namespace:

```yaml
olympic:
  storage:
    provider: cloudinary
  auth:
    registration:
      mode: SELF_VERIFY
  security:
    access-expiration-minutes: 15
    jwt:
      secret-key: ${JWT_SECRET_KEY}
    cookie:
      secure: true
      same-site: Strict
```

- Externalize secrets via `${ENV_VAR}` with dev-only defaults: `${JWT_SECRET_KEY:dev-only-change-me}`.
- Production profile must **not** have default values for secrets.

---

## 17. Security Configuration

> **Reference**: [SecurityChainsConfig.java](file:///home/nghlong3004/projects/olympic-learning-platform/apps/api/src/main/java/me/nghlong3004/olympic/common/security/SecurityChainsConfig.java)

- Stateless JWT via OAuth2 Resource Server.
- Dual `SecurityFilterChain`: API chain (`@Order(1)`) + fallback deny-all chain (`@Order(2)`).
- CSRF disabled (stateless API).
- CORS configured with explicit allowed origins from `ClientProperties`.
- Public endpoints listed explicitly — default is `authenticated()`.
- Admin endpoints gated by `hasRole(Role.ADMIN.name())`.

---

## 18. Coding Conventions Summary

| Item                       | Convention                                                     |
|----------------------------|----------------------------------------------------------------|
| **ID Type**                | `UUID` everywhere                                              |
| **Date/Time**              | `OffsetDateTime` with injected `Clock`                         |
| **Dependency Injection**   | Constructor injection via `@RequiredArgsConstructor`            |
| **Immutable Payloads**     | Java `record` for request, response, DTO                       |
| **Mutable Entities**       | Class with Lombok `@Getter/@Setter/@Builder`                   |
| **Null Safety**            | `Optional` for repository lookups; `.orElseThrow(ErrorCode::throwIt)` |
| **Transaction Scope**      | `@Transactional` on service methods, not on repository         |
| **Static Constants**       | `private static final` inside the class that uses them         |
| **Wildcard Imports**       | Allowed only for same-module request/response packages         |
| **Method Ordering**        | Public overrides → private helpers (bottom of class)           |
| **Error Throwing**         | `throw ErrorCode.SOME_CODE.throwIt()` or `.throwIt("detail")`  |
| **Message Constants**      | Centralized in `common/constant/MessageConstant`, statically imported |
| **Virtual Threads**        | Enabled (`spring.threads.virtual.enabled: true`)               |
| **Java Text Blocks**       | Used for multi-line JPQL queries                               |

---

## 19. Checklist — Before Submitting a New Module

- [ ] Package follows `me.nghlong3004.olympic.<module>/{controller,dto,entity,enums,mapper,repository,request,response,service/impl}`
- [ ] Class names follow FQCN conventions (Section 3)
- [ ] Every file has `@author` + `@since` header
- [ ] Service split: interface with Javadoc in `service/`, implementation with `@Slf4j` in `service/impl/`
- [ ] Entities use `UUID` PK with `GenerationType.UUID`
- [ ] Requests/Responses are `record` types with Bean Validation + `@Schema`
- [ ] Controller methods have `@Operation`, `@ApiResponse`, `@Tag`
- [ ] Errors thrown via `ErrorCode.throwIt()`, new codes added to `ErrorCode` enum
- [ ] `GlobalExceptionHandler` handler added if a new exception type is introduced
- [ ] Mapper uses `@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)`
- [ ] Logging follows the strategy: `INFO` for state transitions, no sensitive data
- [ ] New public endpoints registered in `SecurityChainsConfig` if needed
- [ ] Flyway migration for any schema changes
- [ ] `@Transactional` on service write methods
