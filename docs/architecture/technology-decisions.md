---
last_updated: 2026-07-21
owner: Olympic Engineering
status: Draft
title: Technology Decisions
version: 1
---

# Technology Decisions

> This document records the major technology and architecture decisions
> for the Olympic Learning Platform.
>
> Every significant decision follows an Architecture Decision Record
> (ADR) style to explain **why** it was chosen, not just **what** was
> chosen.

------------------------------------------------------------------------

# Decision Status

  Status       Meaning
  ------------ ---------------------------
  Accepted     Official project standard
  Proposed     Under evaluation
  Deprecated   No longer recommended

------------------------------------------------------------------------

# ADR-001 --- Modular Monolith

**Status:** Accepted

## Context

The project is intended to become a real product while remaining
manageable for a small team.

## Decision

Use a **Modular Monolith** instead of Microservices.

## Rationale

-   Lower operational complexity.
-   Easier local development.
-   Strong module boundaries.
-   Simpler deployment.
-   Can evolve toward services later.

## Alternatives

-   Microservices
-   Traditional layered monolith

## Trade-offs

Pros: - Faster development - Easier debugging - Lower infrastructure
cost

Cons: - Requires discipline to keep module boundaries clean.

Related: - system-overview.md - module-boundaries.md

------------------------------------------------------------------------

# ADR-002 --- Spring Modulith

**Status:** Accepted

## Decision

Use Spring Modulith to define logical application modules.

## Why

-   Explicit module boundaries.
-   Module event support.
-   Architecture verification.
-   Smooth migration path if decomposition becomes necessary.

------------------------------------------------------------------------

# ADR-003 --- DDD Lite

**Status:** Accepted

## Decision

Apply Domain-Driven Design principles selectively.

## Included

-   Ubiquitous language
-   Domain-oriented packages
-   Rich business services

## Excluded

-   Complex tactical patterns unless justified.

Reason: Keep the architecture understandable while improving
maintainability.

------------------------------------------------------------------------

# ADR-004 --- Java 26

**Status:** Accepted

## Decision

Use Java 26.

## Rationale

-   Latest language improvements.
-   Modern APIs.
-   Better developer experience.

Future upgrades should occur only after compatibility verification.

------------------------------------------------------------------------

# ADR-005 --- Spring Boot 4

**Status:** Accepted

## Decision

Spring Boot 4 is the official backend framework.

Reason:

-   Long-term maintainability.
-   Modern Spring ecosystem.
-   Native support for current Java features.

------------------------------------------------------------------------

# ADR-006 --- PostgreSQL

**Status:** Accepted

## Decision

PostgreSQL is the primary relational database.

Reasons

-   Mature ecosystem.
-   Excellent SQL support.
-   Strong indexing.
-   Reliability.
-   Open source.

------------------------------------------------------------------------

# ADR-007 --- Flyway

**Status:** Accepted

## Decision

All schema changes must be managed through Flyway migrations.

Direct database modification is prohibited.

------------------------------------------------------------------------

# ADR-008 --- MapStruct

**Status:** Accepted

## Decision

Object mapping is performed exclusively by MapStruct.

Not allowed:

-   Reflection-based mapping.
-   Manual mapper duplication.

------------------------------------------------------------------------

# ADR-009 --- JWT Authentication

**Status:** Accepted

Authentication strategy:

-   JWT Access Token
-   Refresh Token Rotation
-   Refresh Token Family
-   HttpOnly Cookie

Never store JWT inside LocalStorage.

------------------------------------------------------------------------

# ADR-010 --- RFC7807

**Status:** Accepted

Errors follow the RFC7807 Problem Details specification.

Benefits

-   Standardized error responses.
-   Easier frontend handling.
-   Better API consistency.

------------------------------------------------------------------------

# ADR-011 --- React + TypeScript

**Status:** Accepted

Frontend uses:

-   React
-   TypeScript
-   Vite
-   pnpm

Reason:

Type safety, maintainability, and ecosystem maturity.

------------------------------------------------------------------------

# ADR-012 --- TanStack Query + Zustand

**Status:** Accepted

Responsibilities:

TanStack Query

-   Server State

Zustand

-   UI State

Server data must not be duplicated into Zustand.

------------------------------------------------------------------------

# ADR-013 --- Tailwind CSS v4

**Status:** Accepted

Decision:

Tailwind CSS v4 is the styling foundation.

Reasons:

-   Utility-first workflow.
-   Design token support.
-   Excellent component composition.

------------------------------------------------------------------------

# ADR-014 --- OpenAPI First

**Status:** Accepted

OpenAPI is the single source of truth for API contracts.

Frontend should generate types whenever possible.

Manual duplication should be avoided.

------------------------------------------------------------------------

# ADR-015 --- Documentation First

**Status:** Accepted

Documentation precedes implementation.

Expected workflow:

``` text
Requirement
↓
Architecture
↓
API
↓
Database
↓
Implementation
```

------------------------------------------------------------------------

# ADR-016 --- Docs as Code

**Status:** Accepted

Documentation is version-controlled and reviewed like source code.

Every major architectural change must update documentation.

------------------------------------------------------------------------

# ADR-017 --- AI-Friendly Codebase

**Status:** Accepted

The repository is intentionally designed for AI-assisted development.

Principles

-   Explicit conventions.
-   Predictable project structure.
-   Stable naming.
-   Minimal ambiguity.

------------------------------------------------------------------------

# ADR-018 --- Convention over Configuration

**Status:** Accepted

When multiple solutions are technically valid, prefer the documented
project convention.

Consistency is valued above individual preference.

------------------------------------------------------------------------

# Decision Summary

  Area             Decision
  ---------------- --------------------------
  Architecture     Modular Monolith
  Modules          Spring Modulith
  Design           DDD Lite
  Backend          Spring Boot 4
  Language         Java 26
  Database         PostgreSQL
  Migration        Flyway
  Mapping          MapStruct
  Authentication   JWT + Refresh Rotation
  Error Handling   RFC7807
  Frontend         React + TypeScript
  State            TanStack Query + Zustand
  Styling          Tailwind CSS v4
  API Contract     OpenAPI
  Documentation    Docs as Code

------------------------------------------------------------------------

# Related Documents

-   README.md
-   system-overview.md
-   architecture-contract-v1.0.md
-   backend-architecture.md
-   frontend-architecture.md
