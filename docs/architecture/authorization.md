---
last_updated: 2026-07-21
owner: Olympic Engineering
status: Draft
title: Authorization Architecture
version: 1
---

# Authorization

> This document defines how Olympic determines **what an authenticated
> user is allowed to do**.

------------------------------------------------------------------------

# 1. Purpose

Authentication answers **Who are you?**

Authorization answers **What are you allowed to do?**

The two concerns are intentionally separated.

------------------------------------------------------------------------

# 2. Authorization Model

Olympic adopts **Role-Based Access Control (RBAC)**.

``` mermaid
flowchart LR

User --> Role
Role --> Permission
Permission --> Resource
```

Business rules are expressed through roles and permissions rather than
hard-coded usernames.

------------------------------------------------------------------------

# 3. Roles

Initial roles:

  Role       Responsibility
  ---------- ------------------------------
  STUDENT    Learning, practice, contests
  LECTURER   Academic content management
  ADMIN      Platform administration

Future roles may be introduced without changing existing APIs.

------------------------------------------------------------------------

# 4. Enforcement Layers

Authorization is enforced in multiple layers:

  Layer             Responsibility
  ----------------- ----------------------------
  Spring Security   URL protection
  Method Security   Business authorization
  Service           Ownership & business rules

Repositories must never enforce authorization.

------------------------------------------------------------------------

# 5. Request Flow

``` mermaid
sequenceDiagram

Browser->>SecurityFilter: Bearer JWT
SecurityFilter->>JWT Validator: Validate
JWT Validator-->>SecurityFilter: Authentication
SecurityFilter->>Controller
Controller->>Service
Service->>Authorization Rules
Authorization Rules-->>Service
Service-->>Browser
```

------------------------------------------------------------------------

# 6. JWT Claims

Typical claims include:

-   subject
-   roles
-   issuedAt
-   expiration

Business permissions should not be duplicated in the client.

------------------------------------------------------------------------

# 7. Method Security

Prefer method-level authorization for business operations.

Examples include:

-   Create Problem
-   Publish Contest
-   Delete News

This keeps authorization close to the business use case.

------------------------------------------------------------------------

# 8. Ownership Rules

Some operations depend on ownership in addition to roles.

Example:

A lecturer may edit **only** problems they created unless granted
elevated permissions.

------------------------------------------------------------------------

# 9. HTTP Status

  Situation                                Status
  ---------------------------------------- ------------------
  Missing/invalid token                    401 Unauthorized
  Valid token but insufficient privilege   403 Forbidden

Errors follow RFC7807.

------------------------------------------------------------------------

# 10. CSRF Strategy

Olympic authenticates API requests using **Bearer JWT** in the
`Authorization` header.

Therefore:

-   Stateless REST endpoints authenticated with Bearer tokens **do not
    require CSRF protection**.
-   Browsers do not automatically attach the `Authorization` header,
    eliminating the classic CSRF attack vector.

Refresh tokens are stored in **HttpOnly cookies**. If refresh endpoints
remain cookie-based, they should rely on secure cookie attributes
(`Secure`, `SameSite`) and can introduce additional CSRF protection
later if business requirements change.

------------------------------------------------------------------------

# 11. Best Practices

-   Keep authorization centralized.
-   Prefer declarative security.
-   Return 403 instead of hiding authorization failures.
-   Separate authentication from authorization logic.

------------------------------------------------------------------------

# 12. Anti-patterns

Avoid:

-   Role checks inside repositories.
-   Hard-coded usernames.
-   Business authorization inside controllers.
-   Duplicating permission logic across modules.

------------------------------------------------------------------------

# 13. Future Evolution

Potential future enhancements:

-   Fine-grained permissions
-   ABAC
-   Multi-tenant authorization
-   External Identity Provider

------------------------------------------------------------------------

# Related Documents

-   authentication.md
-   backend-architecture.md
-   request-lifecycle.md
-   backend-conventions.md
