---
last_updated: 2026-07-21
owner: Olympic Engineering
status: Draft
title: Request Lifecycle
version: 1
---

# Request Lifecycle

> This document describes how an HTTP request travels through the
> Olympic backend from the client to the database and back.

------------------------------------------------------------------------

# 1. Purpose

Understanding the request lifecycle helps developers:

-   Debug efficiently
-   Place business logic correctly
-   Maintain consistent architecture
-   Avoid layer violations

------------------------------------------------------------------------

# 2. High-Level Flow

``` mermaid
flowchart LR

Browser --> React
React --> SpringSecurity
SpringSecurity --> Controller
Controller --> Service
Service --> Repository
Repository --> PostgreSQL
PostgreSQL --> Repository
Repository --> Service
Service --> Mapper
Mapper --> Controller
Controller --> React
React --> Browser
```

------------------------------------------------------------------------

# 3. Detailed Sequence

``` mermaid
sequenceDiagram

participant B as Browser
participant F as Spring Security
participant C as Controller
participant S as Service
participant R as Repository
participant DB as PostgreSQL

B->>F: HTTP Request + JWT
F->>F: Authenticate
F->>C: Authenticated Request
C->>C: Bean Validation
C->>S: Delegate
S->>S: Business Rules
S->>R: Query
R->>DB: SQL
DB-->>R: Result
R-->>S: Entity
S->>S: Transaction Complete
S-->>C: Response DTO
C-->>B: JSON Response
```

------------------------------------------------------------------------

# 4. Authentication Phase

Every request first passes through the Spring Security filter chain.

Responsibilities:

-   Parse JWT
-   Validate signature
-   Validate expiration
-   Build Authentication object
-   Populate SecurityContext

If authentication fails:

-   Return 401 Unauthorized
-   Stop request processing

------------------------------------------------------------------------

# 5. Authorization Phase

After authentication:

-   URL rules are checked.
-   Method security is evaluated.
-   Required roles are verified.

If authorization fails:

-   Return 403 Forbidden.

------------------------------------------------------------------------

# 6. Controller Phase

Controller responsibilities:

-   Receive HTTP request
-   Validate request DTO (`@Valid`)
-   Delegate to Service
-   Return HTTP response

Controllers must not:

-   Query the database
-   Contain business rules
-   Start transactions

------------------------------------------------------------------------

# 7. Service Phase

The Service layer is the application core.

Responsibilities:

-   Business rules
-   Transaction boundaries
-   Cross-module coordination
-   Calling repositories
-   Publishing domain events (future)

Every meaningful business decision belongs here.

------------------------------------------------------------------------

# 8. Repository Phase

Repository responsibilities:

-   Persistence
-   Query execution
-   Entity retrieval
-   Entity storage

Repositories must never contain business workflows.

------------------------------------------------------------------------

# 9. Transaction Lifecycle

``` mermaid
sequenceDiagram

Controller->>Service: Call
activate Service
Service->>Repository: Query / Save
Repository-->>Service
Service-->>Controller
deactivate Service
```

Guidelines:

-   `@Transactional(readOnly = true)` for reads.
-   Write transactions start and end in the Service layer.

------------------------------------------------------------------------

# 10. Mapping Phase

MapStruct converts:

-   Entity → Response
-   Request → Entity

Forbidden:

-   Validation
-   SQL
-   Repository access

------------------------------------------------------------------------

# 11. Exception Flow

``` mermaid
flowchart TD

BusinessException --> GlobalExceptionHandler
ValidationException --> GlobalExceptionHandler
AccessDeniedException --> GlobalExceptionHandler

GlobalExceptionHandler --> ProblemDetail
ProblemDetail --> Client
```

All errors are converted to RFC7807 Problem Details.

------------------------------------------------------------------------

# 12. Successful Response

A successful response should:

-   Return the requested resource.
-   Use appropriate HTTP status codes.
-   Avoid unnecessary wrappers.

Example:

``` json
{
  "id": "uuid",
  "title": "Problem A"
}
```

------------------------------------------------------------------------

# 13. Failure Response

Standardized fields include:

-   type
-   title
-   status
-   detail
-   instance
-   traceId

The exact format is defined by RFC7807.

------------------------------------------------------------------------

# 14. Logging & Observability

Every request should be traceable through:

-   Trace ID
-   Structured logs
-   Metrics
-   Audit logs (where applicable)

Sensitive information such as passwords and tokens must never be logged.

------------------------------------------------------------------------

# 15. Best Practices

-   Keep controllers thin.
-   Keep services cohesive.
-   Return DTOs instead of entities.
-   Validate early.
-   Fail fast.
-   Use transactions intentionally.

------------------------------------------------------------------------

# 16. Anti-patterns

Do not:

-   Inject repositories into controllers.
-   Put business logic in mappers.
-   Catch generic Exception everywhere.
-   Return entities directly.
-   Perform remote calls inside transactions unless necessary.

------------------------------------------------------------------------

# 17. Related Documents

-   backend-architecture.md
-   module-boundaries.md
-   authentication.md
-   authorization.md
-   backend-conventions.md
-   technology-decisions.md
