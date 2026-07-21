---
last_updated: 2026-07-21
owner: Olympic Engineering
status: Draft
title: API Communication
version: 1
---

# API Communication

> This document defines how the frontend communicates with the Olympic
> Learning Platform backend.

------------------------------------------------------------------------

# 1. Purpose

Goals:

-   Centralized HTTP communication
-   Consistent authentication
-   Predictable error handling
-   Automatic token refresh
-   Type-safe API integration

------------------------------------------------------------------------

# 2. Architecture

``` mermaid
flowchart LR

Component --> Feature
Feature --> Service
Service --> AxiosInstance
AxiosInstance --> RequestInterceptor
RequestInterceptor --> SpringAPI
SpringAPI --> ResponseInterceptor
ResponseInterceptor --> TanStackQuery
TanStackQuery --> Component
```

Only the Service layer communicates with Axios.

------------------------------------------------------------------------

# 3. Axios Instance

A single shared Axios instance is responsible for:

-   Base URL
-   Default headers
-   Timeout
-   Credentials
-   Request interceptors
-   Response interceptors

Never create ad-hoc Axios instances inside features.

------------------------------------------------------------------------

# 4. Request Lifecycle

``` mermaid
sequenceDiagram

participant UI
participant Service
participant Axios
participant API

UI->>Service: invoke()
Service->>Axios: request()
Axios->>API: HTTP Request
API-->>Axios: HTTP Response
Axios-->>Service
Service-->>UI
```

------------------------------------------------------------------------

# 5. Authentication Flow

Protected requests automatically include:

``` text
Authorization: Bearer <access_token>
```

Access tokens are stored client-side according to the authentication
architecture.

Refresh tokens remain in HttpOnly cookies and are never read by
JavaScript.

------------------------------------------------------------------------

# 6. 401 Recovery Flow

``` mermaid
sequenceDiagram

Client->>API: Request
API-->>Client: 401
Client->>Refresh API: Refresh
Refresh API-->>Client: New Access Token
Client->>API: Retry Original Request
API-->>Client: Success
```

Rules:

-   Retry only once.
-   Queue concurrent requests during refresh.
-   Logout if refresh fails.

------------------------------------------------------------------------

# 7. Error Handling

Backend errors follow RFC7807.

The response interceptor maps errors into frontend-friendly structures.

Examples:

-   Validation errors
-   Unauthorized
-   Forbidden
-   Not Found
-   Unexpected server errors

UI components should never parse raw HTTP responses.

------------------------------------------------------------------------

# 8. Timeout Policy

Recommended defaults:

-   Reasonable request timeout
-   Cancel abandoned requests
-   Display meaningful feedback to users

------------------------------------------------------------------------

# 9. Request Cancellation

Use AbortController for:

-   Search
-   Auto-complete
-   Route changes
-   Rapid user interactions

Avoid updating unmounted components.

------------------------------------------------------------------------

# 10. Service Convention

Each feature owns its own service.

Example:

``` text
features/
└── auth/
    └── services/
        └── auth.service.ts
```

Services:

-   Build requests
-   Return typed data
-   Never render UI

------------------------------------------------------------------------

# 11. Response Validation

When appropriate, validate external responses using Zod before exposing
data to the application.

------------------------------------------------------------------------

# 12. Logging

Frontend may log:

-   Development diagnostics
-   Unexpected client errors

Never log:

-   Access tokens
-   Refresh tokens
-   Passwords
-   Sensitive personal information

------------------------------------------------------------------------

# 13. Anti-patterns

Never:

-   Call Axios directly from components
-   Duplicate authentication logic
-   Retry indefinitely
-   Ignore cancellation
-   Scatter API URLs throughout the codebase

------------------------------------------------------------------------

# 14. Review Checklist

-   [ ] Uses shared Axios instance
-   [ ] Uses feature service
-   [ ] Authorization header applied
-   [ ] Refresh flow supported
-   [ ] RFC7807 handled
-   [ ] Request cancellation considered
-   [ ] Strong typing maintained

------------------------------------------------------------------------

# Related Documents

-   frontend-architecture.md
-   state-management.md
-   authentication.md
-   request-lifecycle.md
-   frontend-conventions.md
