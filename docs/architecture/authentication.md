---
last_updated: 2026-07-21
owner: Olympic Engineering
status: Draft
title: Authentication Architecture
version: 1
---

# Authentication

> This document specifies the authentication architecture used by the
> Olympic Learning Platform.

------------------------------------------------------------------------

# 1. Purpose

Authentication verifies user identity before any protected resource is
accessed.

Goals:

-   Secure authentication
-   Stateless access tokens
-   Revocable refresh sessions
-   Protection against token theft
-   Consistent authentication flow

------------------------------------------------------------------------

# 2. Authentication Components

  Component                Responsibility
  ------------------------ -------------------------------------------
  Spring Security          Security framework
  JWT Access Token         Short-lived API authentication
  Refresh Token            Obtain new access tokens
  Refresh Token Rotation   Replace refresh token after every refresh
  Refresh Token Family     Detect token replay
  HttpOnly Cookie          Secure refresh token storage
  Email Verification       Activate account
  Password Reset           Recover credentials

------------------------------------------------------------------------

# 3. High-Level Flow

``` mermaid
flowchart LR

Browser --> LoginAPI
LoginAPI --> JWT
JWT --> ProtectedAPI
ProtectedAPI --> Browser

Browser --> RefreshAPI
RefreshAPI --> NewJWT
```

------------------------------------------------------------------------

# 4. Login Flow

``` mermaid
sequenceDiagram

participant U as User
participant C as Client
participant S as Spring Boot
participant DB as Database

U->>C: Login
C->>S: POST /auth/login
S->>DB: Verify credentials
DB-->>S
S-->>C: Access Token + Refresh Cookie
```

On success:

-   JWT access token returned.
-   Refresh token stored in HttpOnly cookie.
-   Security context established for subsequent requests.

------------------------------------------------------------------------

# 5. Access Token

Characteristics:

-   Short-lived
-   Signed JWT
-   Sent using Authorization header

Example:

``` text
Authorization: Bearer <access_token>
```

Access tokens are never persisted by the backend.

------------------------------------------------------------------------

# 6. Refresh Token Rotation

Every successful refresh operation:

1.  Validates current refresh token.
2.  Invalidates the previous token.
3.  Creates a brand-new refresh token.
4.  Returns a new access token.

This reduces the impact of stolen refresh tokens.

------------------------------------------------------------------------

# 7. Refresh Token Family

Refresh tokens belong to the same token family.

``` mermaid
flowchart LR

RT1 --> RT2 --> RT3 --> RT4
```

If an old refresh token is reused:

-   Entire family is revoked.
-   User must authenticate again.

This provides replay attack detection.

------------------------------------------------------------------------

# 8. Email Verification

Before full account activation:

1.  User registers.
2.  Verification email is sent.
3.  User opens verification link.
4.  Account becomes verified.

Unverified accounts have limited authentication capabilities according
to business rules.

------------------------------------------------------------------------

# 9. Password Reset

Flow:

``` mermaid
sequenceDiagram

User->>Server: Request reset
Server-->>User: Email link
User->>Server: New password
Server-->>User: Success
```

Requirements:

-   One-time token
-   Expiration time
-   Immediate invalidation after use

------------------------------------------------------------------------

# 10. Logout

Logout performs:

-   Refresh token revocation
-   Cookie removal
-   Session invalidation (logical)
-   Client access token discard

------------------------------------------------------------------------

# 11. Failure Scenarios

  Situation                 Response
  ------------------------- -------------------------
  Invalid credentials       401 Unauthorized
  Expired access token      401 Unauthorized
  Invalid refresh token     401 Unauthorized
  Refresh replay detected   Revoke token family
  Unverified account        Business error response

Errors follow RFC7807 Problem Details.

------------------------------------------------------------------------

# 12. Security Principles

-   Never store JWT in LocalStorage.
-   Always use HTTPS in production.
-   Refresh tokens remain HttpOnly.
-   Rotate refresh tokens after every use.
-   Validate token expiration.
-   Record security-sensitive events.

------------------------------------------------------------------------

# 13. Responsibilities

Client:

-   Send access token.
-   Retry once after refresh.
-   Logout when refresh fails.

Backend:

-   Validate JWT.
-   Rotate refresh token.
-   Detect replay.
-   Enforce authentication rules.

------------------------------------------------------------------------

# 14. Future Enhancements

Possible future additions:

-   OAuth2 Login
-   MFA / TOTP
-   Passkeys
-   Device management
-   Session dashboard

------------------------------------------------------------------------

# 15. Related Documents

-   authorization.md
-   backend-architecture.md
-   request-lifecycle.md
-   technology-decisions.md
