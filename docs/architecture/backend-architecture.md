---
last_updated: 2026-07-21
owner: Olympic Engineering
status: Draft
title: Backend Architecture
version: 1
---

# Backend Architecture

> This document defines the backend architecture, layering,
> responsibilities, and development conventions for the Olympic Learning
> Platform.

------------------------------------------------------------------------

# 1. Purpose

This document serves as the architectural guide for all backend
development.

It defines:

-   Architectural style
-   Layer responsibilities
-   Module organization
-   Dependency rules
-   Coding boundaries

------------------------------------------------------------------------

# 2. Architecture Style

Olympic backend adopts:

-   Modular Monolith
-   Spring Modulith
-   DDD Lite
-   Layered Architecture

Each module owns its business logic while sharing the same runtime.

------------------------------------------------------------------------

# 3. High-Level Architecture

``` mermaid
flowchart LR

Client --> Controller
Controller --> Service
Service --> Mapper
Service --> Repository
Repository --> PostgreSQL
Service --> DomainEvent
```

Only the Service layer coordinates business workflows.

------------------------------------------------------------------------

# 4. Layer Responsibilities

  Layer        Responsibility
  ------------ ---------------------------------
  Controller   HTTP request/response only
  Service      Business logic and transactions
  Repository   Persistence
  Mapper       Entity ↔ DTO conversion
  Entity       Persistent domain model

------------------------------------------------------------------------

# 5. Dependency Rules

``` text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

Rules:

-   Controller never calls Repository directly.
-   Mapper never accesses the database.
-   Repository never returns Response DTOs.
-   Entity never depends on Spring components.

------------------------------------------------------------------------

# 6. Module Structure

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

Every business module follows the same structure.

------------------------------------------------------------------------

# 7. Request Processing

``` mermaid
sequenceDiagram

Client->>Controller: HTTP Request
Controller->>Service: Validate & Delegate
Service->>Repository: Query
Repository->>Database: SQL
Database-->>Repository
Repository-->>Service
Service->>Mapper: Convert
Mapper-->>Service
Service-->>Controller
Controller-->>Client: JSON
```

------------------------------------------------------------------------

# 8. Transactions

Business transactions belong to the Service layer.

Guidelines:

-   Read operations should prefer `@Transactional(readOnly = true)`.
-   Write operations define transaction boundaries.
-   Never open transactions inside Controllers.

------------------------------------------------------------------------

# 9. Validation Strategy

Validation occurs at multiple levels:

-   Frontend (UX)
-   Controller (`@Valid`)
-   Service (business rules)
-   Database (constraints)

Each level complements the others.

------------------------------------------------------------------------

# 10. Exception Handling

Global exception handling is centralized.

Components:

-   GlobalExceptionHandler
-   ErrorCode
-   RFC7807 ProblemDetail
-   Trace ID

Business code should throw domain-specific exceptions rather than
generic runtime exceptions.

------------------------------------------------------------------------

# 11. Security

Security is enforced through:

-   Spring Security
-   JWT
-   Refresh Token Rotation
-   Role-based authorization
-   HttpOnly cookies

Controllers should rely on Security configuration rather than
implementing authorization manually.

------------------------------------------------------------------------

# 12. Mapping Strategy

MapStruct is the only supported mapping solution.

Mapper responsibilities:

-   Entity → Response
-   Request → Entity
-   DTO transformations

Forbidden:

-   Database access
-   Validation
-   Business logic

------------------------------------------------------------------------

# 13. Repository Rules

Repositories:

-   Extend Spring Data interfaces.
-   Encapsulate persistence.
-   Never contain business workflows.
-   Prefer derived queries before custom SQL.

------------------------------------------------------------------------

# 14. Backend Principles

Every module should exhibit:

-   High cohesion
-   Low coupling
-   Explicit boundaries
-   Predictable naming
-   Clear ownership

------------------------------------------------------------------------

# 15. Anti-patterns

Avoid:

-   Business logic in Controllers.
-   Repository injection into Controllers.
-   Static utility classes for domain logic.
-   Circular module dependencies.
-   Large "God Services".

------------------------------------------------------------------------

# 16. Related Documents

-   module-boundaries.md
-   backend-conventions.md
-   authentication.md
-   authorization.md
-   request-lifecycle.md
-   technology-decisions.md

------------------------------------------------------------------------

# 17. Checklist

Before merging backend code:

-   Controller delegates only.
-   Service owns business logic.
-   Mapper only maps.
-   Repository only persists.
-   Validation applied.
-   Transaction boundary defined.
-   Tests added.
-   Documentation updated if architecture changed.
