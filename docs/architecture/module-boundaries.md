---
last_updated: 2026-07-21
owner: Olympic Engineering
status: Draft
title: Module Boundaries
version: 1
---

# Module Boundaries

> This document defines how backend modules are organized, how they
> communicate, and which dependencies are allowed.

------------------------------------------------------------------------

# 1. Purpose

Module boundaries ensure:

-   High cohesion
-   Low coupling
-   Clear ownership
-   Independent evolution
-   Predictable architecture

The project follows **Spring Modulith** to enforce logical module
boundaries.

------------------------------------------------------------------------

# 2. Module List

``` text
auth
user
subject
topic
news
document
problem
practice
contest
submission
analytics
notification
ai
```

Each module owns its own:

-   Controller
-   Service
-   Repository
-   Entity
-   DTO
-   Exceptions

------------------------------------------------------------------------

# 3. Ownership Principle

Every business concept has exactly **one owning module**.

Examples:

  Business Concept   Owner
  ------------------ ------------
  User               user
  Subject            subject
  Problem            problem
  Contest            contest
  Submission         submission

Other modules must not duplicate ownership.

------------------------------------------------------------------------

# 4. Dependency Rules

``` mermaid
flowchart TD

Auth --> User
Subject --> Topic
Topic --> Problem
Problem --> Practice
Problem --> Contest
Contest --> Submission
Submission --> Analytics
```

Dependencies should always point toward more stable business concepts.

Circular dependencies are forbidden.

------------------------------------------------------------------------

# 5. Allowed Communication

Preferred order:

1.  Service-to-Service (same module only)
2.  Public service exposed by another module
3.  Domain Events (future)
4.  REST API (external only)

Repositories must never be shared across modules.

------------------------------------------------------------------------

# 6. Forbidden Dependencies

The following are prohibited:

-   Controller → Controller
-   Controller → Repository
-   Repository → Repository (cross-module)
-   Entity → Entity (cross-module behavior)
-   Circular module references

------------------------------------------------------------------------

# 7. Public Module API

Each module should expose only:

-   REST Controller
-   Public Service Interface
-   Domain Events (future)

Everything else should remain internal.

------------------------------------------------------------------------

# 8. Shared Components

Shared infrastructure belongs outside business modules.

Examples:

``` text
common/
config/
security/
exception/
util (minimal)
```

Business logic must never migrate into shared packages.

------------------------------------------------------------------------

# 9. Domain Events (Future)

For future decoupling, modules may publish domain events.

``` mermaid
sequenceDiagram

Problem->>EventBus: ProblemPublished
EventBus-->>Notification
EventBus-->>Analytics
```

Events should describe facts that already happened.

------------------------------------------------------------------------

# 10. Naming Convention

Module names:

-   singular package name
-   lowercase
-   business-oriented

Examples:

``` text
problem
contest
submission
```

Avoid technical package names such as:

``` text
service
repository
business
manager
```

at the project root.

------------------------------------------------------------------------

# 11. Anti-patterns

Avoid:

-   God modules
-   Shared repositories
-   Cross-module entity mutation
-   Hidden dependencies
-   Circular references
-   Utility modules containing business logic

------------------------------------------------------------------------

# 12. Checklist

Before introducing a dependency:

-   Does another module already own this concept?
-   Is a public service sufficient?
-   Would a domain event reduce coupling?
-   Does this introduce a circular dependency?
-   Is the dependency documented?

------------------------------------------------------------------------

# Related Documents

-   backend-architecture.md
-   request-lifecycle.md
-   backend-conventions.md
-   technology-decisions.md
