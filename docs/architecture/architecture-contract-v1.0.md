# Olympic Learning Platform -- Architecture Contract v1.0

> Status: **Draft**\
> Last Updated: **2026-07-21**

## 1. Project Philosophy

### Project Type

-   Enterprise-grade Learning Platform.
-   Production-oriented, not a CRUD demo.
-   Long-term maintainable and AI-friendly.

### Development Principles

-   Specification First Development
-   API First
-   Documentation Driven
-   Convention over Configuration
-   AI Friendly Codebase

Development flow:

``` text
Requirement
    ↓
Architecture
    ↓
API
    ↓
Database
    ↓
Backend
    ↓
Frontend
    ↓
Test
```

------------------------------------------------------------------------

## 2. Overall Architecture

-   Architecture Style: **Modular Monolith**
-   Approach:
    -   Spring Modulith
    -   DDD Lite
    -   Layered Architecture

------------------------------------------------------------------------

## 3. Backend Technology Stack

  Component    Decision
  ------------ -------------------------
  Java         Java 26
  Framework    Spring Boot 4.x
  Build        Maven
  Database     PostgreSQL
  Migration    Flyway
  ORM          Spring Data JPA
  Validation   Jakarta Validation
  Security     Spring Security
  JWT          OAuth2 Resource Server
  Mapper       MapStruct
  Mail         Spring Mail
  API Docs     springdoc OpenAPI
  Metrics      Micrometer + Prometheus
  Cache        Redis (when required)
  AI           Spring AI

------------------------------------------------------------------------

## 4. Backend Package Convention

Each domain owns its own package.

``` text
problem/
├── controller/
├── service/
│   └── impl/
├── repository/
├── mapper/
├── entity/
├── request/
├── response/
├── dto/
└── exception/
```

Do **not** organize the application by technical layers at the project
root.

------------------------------------------------------------------------

## 5. Service Convention

-   Interface + Implementation

``` text
ProblemService
ProblemServiceImpl
```

-   Controllers contain no business logic.
-   Implementations reside in `service/impl`.

------------------------------------------------------------------------

## 6. DTO Convention

-   Use Java `record`.
-   Prefer dedicated DTOs.

Examples:

-   CreateProblemRequest
-   UpdateProblemRequest
-   ProblemSummaryResponse
-   ProblemDetailResponse

Avoid generic names such as `ProblemDto`.

------------------------------------------------------------------------

## 7. Entity Convention

-   Lombok
-   Do not use `@Data`
-   No dependency injection
-   No repository access
-   Keep entities persistence-focused

------------------------------------------------------------------------

## 8. Mapping Convention

-   MapStruct only.
-   Mapper performs mapping only.
-   No validation.
-   No database query.

------------------------------------------------------------------------

## 9. REST API Convention

Base path:

``` text
/api/v1
```

Resources use plural nouns.

``` text
/users
/problems
/subjects
```

Methods:

  Method   Purpose
  -------- ----------------
  GET      Read
  POST     Create
  PUT      Replace
  PATCH    Partial Update
  DELETE   Soft Delete

Success responses return resource DTOs.

Errors use RFC7807 ProblemDetail.

No generic ApiResponse wrapper.

------------------------------------------------------------------------

## 10. Pagination

Offset pagination

``` text
?page=0&size=20&sort=name,asc
```

Suitable for:

-   Admin
-   Dashboard
-   Backoffice

Cursor pagination

Suitable for:

-   News
-   Timeline
-   Leaderboard

------------------------------------------------------------------------

## 11. Sorting

``` text
sort=name,asc
sort=createdAt,desc
```

Supports multiple sort parameters.

------------------------------------------------------------------------

## 12. Filtering

Prefer query parameters.

Example

``` text
?difficulty=EASY
&status=PUBLISHED
&subjectId=...
&createdAfter=...
&createdBefore=...
```

No RSQL in the initial version.

------------------------------------------------------------------------

## 13. Identifier

Primary key:

-   UUID v4

Slug:

-   SEO only
-   Never primary key

------------------------------------------------------------------------

## 14. Database Convention

Tables

``` text
users
subjects
problems
```

Naming

-   snake_case

Audit columns

-   created_at
-   updated_at
-   deleted_at

Migration

-   Flyway

------------------------------------------------------------------------

## 15. Security

-   JWT
-   Access Token
-   Refresh Token Rotation
-   Refresh Queue (Frontend)
-   HttpOnly Cookie
-   CSRF Protection
-   Password Policy
-   Audit Log
-   Email Verification

Never store JWT in LocalStorage.

------------------------------------------------------------------------

## 16. Frontend Stack

  Component         Decision
  ----------------- ---------------------
  React             Latest Stable
  TypeScript        7.x
  Vite              Yes
  Package Manager   pnpm
  Tailwind CSS      v4
  Radix UI          Yes
  shadcn/ui         Yes
  Lucide            Yes
  Sonner            Yes
  Framer Motion     Yes
  GSAP              Only when necessary
  React Hook Form   Yes
  Zod               v4
  TanStack Query    Yes
  Axios             Yes
  Zustand           Yes

------------------------------------------------------------------------

## 17. Frontend Architecture

-   CSR
-   Feature-first
-   Route-level lazy loading
-   `@` path alias

------------------------------------------------------------------------

## 18. State Management

TanStack Query

-   Server State

Zustand

-   UI State

Never duplicate server state inside Zustand.

------------------------------------------------------------------------

## 19. API Communication

-   Axios Instance
-   Axios Interceptor
-   Refresh Queue
-   Retry once after refresh
-   Logout if refresh fails

------------------------------------------------------------------------

## 20. Design System

Required

-   Dark Mode
-   Primary
-   Secondary
-   Danger
-   Ghost
-   Link

Use design tokens instead of hard-coded colors.

------------------------------------------------------------------------

## 21. Validation

Frontend

-   User Experience

Backend

-   Security

Database

-   Data Integrity

Frontend validation never replaces backend validation.

------------------------------------------------------------------------

## 22. Coding Convention

-   No wildcard imports
-   Constructor Injection
-   No Field Injection
-   No business logic in Controller
-   No database query in Mapper
-   No DTO inside Repository
-   No ResponseEntity in Service
-   No random static utilities
-   Composition over Inheritance
-   SOLID
-   KISS
-   YAGNI
-   DRY

------------------------------------------------------------------------

## 23. Documentation Convention

Every class includes Javadoc.

``` java
/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 2026-07-21
 */
```

Service interfaces must document:

-   Purpose
-   Parameters
-   Return value
-   Exceptions

------------------------------------------------------------------------

## 24. Engineering Convention

-   pnpm
-   Oxlint
-   Prettier
-   Conventional Commits
-   GitHub
-   GitHub Actions
-   Minimum 80% test coverage

------------------------------------------------------------------------

## 25. Testing Strategy

-   Unit Test
-   Integration Test
-   Repository Test
-   Security Test

E2E is not a priority during the initial phase.

------------------------------------------------------------------------

## 26. Additional Architecture Decisions

### OpenAPI as Single Source of Truth

Frontend types should be generated from OpenAPI whenever possible.

### ADR

Major architecture changes must be recorded under `docs/adr`.

### Performance by Default

-   Route-level lazy loading
-   Backend pagination/filtering
-   Tree-shake icon usage
-   Use GSAP only when CSS or Framer Motion is insufficient
