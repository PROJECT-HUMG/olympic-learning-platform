---
last_updated: 2026-07-21
owner: Olympic Engineering
status: Draft
title: System Overview
version: 1
---

# System Overview

> This document provides a high-level overview of the Olympic Learning
> Platform architecture. It describes the system boundaries, major
> components, design goals, and how the different parts of the platform
> interact.

------------------------------------------------------------------------

# 1. Purpose

The purpose of this document is to establish a common understanding of
the system before discussing implementation details.

It intentionally avoids low-level implementation details. Those belong
to later architecture documents.

------------------------------------------------------------------------

# 2. Product Vision

Olympic is an integrated learning platform focused on:

-   Learning
-   Practice
-   Mock Examination
-   Contest Management
-   Analytics
-   Talent Discovery

The platform is designed to support students, lecturers, and
administrators in a single ecosystem.

------------------------------------------------------------------------

# 3. Architecture Style

Olympic adopts the following architectural approach:

-   Modular Monolith
-   Spring Modulith
-   DDD Lite
-   Layered Architecture
-   RESTful API
-   Feature-first Frontend

Why Modular Monolith?

-   Easier deployment
-   Clear module boundaries
-   Lower operational complexity
-   Straightforward migration to microservices if needed

------------------------------------------------------------------------

# 4. System Context

``` mermaid
flowchart LR

Student --> Olympic
Lecturer --> Olympic
Admin --> Olympic

Olympic --> PostgreSQL
Olympic --> Redis
Olympic --> Mail
Olympic --> ObjectStorage[(Future Storage)]
```

The Olympic platform acts as the central system coordinating all
business capabilities.

------------------------------------------------------------------------

# 5. Container Overview

``` mermaid
flowchart LR

Browser --> React

React -->|REST API| SpringBoot

SpringBoot --> PostgreSQL
SpringBoot --> Redis
SpringBoot --> Mail
```

Responsibilities:

  Component     Responsibility
  ------------- --------------------------------------
  React         User Interface
  Spring Boot   Business Logic
  PostgreSQL    Persistent Data
  Redis         Cache / Session-related optimization
  Mail          Verification & Notifications

------------------------------------------------------------------------

# 6. Core Modules

The initial platform contains the following modules:

1.  Authentication
2.  User
3.  Subject
4.  Topic
5.  News
6.  Document
7.  Problem
8.  Practice
9.  Contest
10. Submission
11. Analytics
12. Notification
13. AI Assistant

Each module owns its own business logic and persistence layer.

------------------------------------------------------------------------

# 7. Request Lifecycle

``` mermaid
sequenceDiagram

Browser->>React: User Action

React->>Spring: HTTP Request

Spring->>Service: Business Logic

Service->>Repository: Database Query

Repository->>PostgreSQL: SQL

PostgreSQL-->>Repository: Result

Repository-->>Service

Service-->>Spring

Spring-->>React

React-->>Browser
```

The detailed lifecycle is documented in `request-lifecycle.md`.

------------------------------------------------------------------------

# 8. Cross-cutting Concerns

The following concerns apply across every module:

-   Authentication
-   Authorization
-   Validation
-   Logging
-   Exception Handling
-   Metrics
-   Audit
-   Mail
-   Documentation

These concerns should remain consistent throughout the project.

------------------------------------------------------------------------

# 9. Non-functional Goals

## Maintainability

Clear module boundaries and documented conventions.

## Scalability

Support increasing users and data volume without major redesign.

## Security

Defense in depth through validation, authentication, authorization, and
secure defaults.

## Performance

Pagination, caching where appropriate, and efficient database access.

## Observability

Metrics, logs, and trace identifiers to simplify diagnosis.

------------------------------------------------------------------------

# 10. Architectural Principles

Every implementation should respect these principles:

-   High cohesion
-   Low coupling
-   Explicit boundaries
-   Predictable APIs
-   Documentation First
-   Convention over Configuration

------------------------------------------------------------------------

# 11. Module Relationships

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

Dependencies should always point toward stable business concepts.

------------------------------------------------------------------------

# 12. Future Evolution

The architecture intentionally leaves room for:

-   Search engine integration
-   Object storage
-   Event-driven processing
-   Recommendation engine
-   AI-powered learning assistance
-   External integrations

These capabilities should be added without breaking existing module
contracts.

------------------------------------------------------------------------

# 13. Related Documents

-   README.md
-   technology-decisions.md
-   backend-architecture.md
-   frontend-architecture.md
-   module-boundaries.md
-   request-lifecycle.md

------------------------------------------------------------------------

# 14. Key Takeaways

-   Olympic is a Modular Monolith.
-   Spring Modulith defines logical module boundaries.
-   REST APIs connect the frontend and backend.
-   PostgreSQL is the primary data store.
-   Redis is used selectively for performance improvements.
-   Documentation is the primary source of architectural truth.
