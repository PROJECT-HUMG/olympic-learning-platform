---
last_updated: 2026-07-21
owner: Olympic Engineering
status: Draft
title: Backend Conventions
version: 1
---

# Backend Conventions

> This document defines the mandatory engineering conventions for all
> backend code in the Olympic Learning Platform.

------------------------------------------------------------------------

# 1. Purpose

These conventions exist to ensure:

-   Consistency
-   Maintainability
-   Readability
-   AI-friendly code generation
-   Predictable architecture

If multiple implementations are technically valid, follow **this
document**.

------------------------------------------------------------------------

# 2. General Principles

Mandatory principles:

-   SOLID
-   DRY
-   KISS
-   YAGNI
-   Composition over Inheritance
-   Convention over Configuration

------------------------------------------------------------------------

# 3. Package Structure

Every business module follows:

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

Never organize the application by global technical layers.

------------------------------------------------------------------------

# 4. Naming Conventions

  Component      Pattern
  -------------- ----------------------------
  Controller     `ProblemController`
  Service        `ProblemService`
  Service Impl   `ProblemServiceImpl`
  Repository     `ProblemRepository`
  Mapper         `ProblemMapper`
  Entity         `Problem`
  Request        `CreateProblemRequest`
  Response       `ProblemDetailResponse`
  Exception      `ProblemNotFoundException`

Avoid abbreviations and ambiguous names.

------------------------------------------------------------------------

# 5. Controller Convention

Controllers should:

-   Handle HTTP only.
-   Validate request DTOs.
-   Delegate to services.
-   Return response DTOs.

Controllers must never:

-   Access repositories.
-   Contain business rules.
-   Open transactions.

------------------------------------------------------------------------

# 6. Service Convention

Services own business workflows.

Responsibilities:

-   Business logic
-   Transactions
-   Coordination
-   Authorization decisions (business ownership)
-   Domain events (future)

Always expose an interface and implementation.

------------------------------------------------------------------------

# 7. Repository Convention

Repositories:

-   Extend Spring Data interfaces.
-   Persist entities only.
-   Return entities or projections.
-   Never return response DTOs.

Business logic is forbidden.

------------------------------------------------------------------------

# 8. Entity Convention

Rules:

-   `@Getter`
-   `@Builder`
-   Protected no-args constructor
-   No `@Data`
-   No dependency injection
-   No repository access

Entities model persistence, not application services.

------------------------------------------------------------------------

# 9. DTO Convention

Use Java records whenever possible.

Separate:

-   request
-   response
-   dto

Avoid generic `XXXDto`.

------------------------------------------------------------------------

# 10. Mapper Convention

MapStruct is mandatory.

Allowed:

-   Entity ↔ DTO mapping

Forbidden:

-   SQL
-   Validation
-   Repository access
-   Business logic

------------------------------------------------------------------------

# 11. Validation Convention

Validation layers:

1.  Frontend (UX)
2.  Bean Validation (`@Valid`)
3.  Business validation
4.  Database constraints

Do not rely on only one layer.

------------------------------------------------------------------------

# 12. REST Convention

Base path:

``` text
/api/v1
```

Plural resources only.

Use:

-   GET
-   POST
-   PUT
-   PATCH
-   DELETE (soft delete)

Errors follow RFC7807.

------------------------------------------------------------------------

# 13. Transaction Convention

-   Transaction boundaries belong to services.
-   Read operations use `@Transactional(readOnly = true)` when
    appropriate.
-   Never start transactions in controllers.

------------------------------------------------------------------------

# 14. JPA Convention

Prefer:

-   Explicit fetch strategy
-   Lazy loading by default
-   Entity relationships only when justified

Avoid:

-   N+1 queries
-   EAGER by default
-   Massive entity graphs

------------------------------------------------------------------------

# 15. Logging Convention

Log:

-   Important business events
-   Security events
-   Unexpected failures

Never log:

-   Passwords
-   JWTs
-   Refresh tokens
-   Secrets

Always include Trace ID when available.

------------------------------------------------------------------------

# 16. Exception Convention

Centralize exception handling through:

-   GlobalExceptionHandler
-   ErrorCode
-   ProblemDetail

Never swallow exceptions silently.

------------------------------------------------------------------------

# 17. Testing Convention

Minimum expectations:

-   Unit tests
-   Integration tests
-   Repository tests
-   Security tests

Target: ≥80% meaningful coverage.

------------------------------------------------------------------------

# 18. Performance Guidelines

-   Paginate large queries.
-   Select only required columns.
-   Avoid unnecessary database calls.
-   Cache only after measurement.
-   Measure before optimizing.

------------------------------------------------------------------------

# 19. Anti-patterns

Never:

-   Inject repositories into controllers.
-   Return entities from controllers.
-   Use wildcard imports.
-   Use field injection.
-   Create "God" services.
-   Duplicate business rules.
-   Hide exceptions.

------------------------------------------------------------------------

# 20. Backend Review Checklist

Before merge:

-   [ ] Naming follows conventions.
-   [ ] Controller is thin.
-   [ ] Service owns business logic.
-   [ ] Repository only persists.
-   [ ] DTOs are records.
-   [ ] Mapper uses MapStruct.
-   [ ] Validation complete.
-   [ ] Transactions correct.
-   [ ] Logs are safe.
-   [ ] Tests added.
-   [ ] Javadoc updated.
-   [ ] Documentation updated if architecture changed.

------------------------------------------------------------------------

# Related Documents

-   backend-architecture.md
-   module-boundaries.md
-   request-lifecycle.md
-   authentication.md
-   authorization.md
-   technology-decisions.md
