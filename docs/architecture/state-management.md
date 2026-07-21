---
last_updated: 2026-07-21
owner: Olympic Engineering
status: Draft
title: State Management
version: 1
---

# State Management

> This document defines how state is managed throughout the Olympic
> Learning Platform frontend.

------------------------------------------------------------------------

# 1. Objectives

The architecture separates state into two categories:

-   **Server State** → managed by TanStack Query
-   **UI State** → managed by Zustand

Keeping these concerns separate reduces complexity and prevents
duplicated data.

------------------------------------------------------------------------

# 2. State Classification

  State          Owner            Examples
  -------------- ---------------- -------------------------------------
  Server State   TanStack Query   User profile, courses, contests
  UI State       Zustand          Theme, sidebar, modal, drawer
  Local State    React            Input values, toggles, temporary UI

------------------------------------------------------------------------

# 3. Data Lifecycle

``` mermaid
flowchart TD

UserAction --> Component
Component --> QueryOrMutation
QueryOrMutation --> Axios
Axios --> Backend
Backend --> QueryCache
QueryCache --> ComponentRender
ComponentRender --> UpdatedUI
```

Every API interaction follows this lifecycle.

------------------------------------------------------------------------

# 4. TanStack Query Responsibilities

Use TanStack Query for:

-   Fetching
-   Caching
-   Background refetch
-   Retry
-   Pagination
-   Infinite queries
-   Mutations
-   Cache invalidation

Never copy query results into Zustand.

------------------------------------------------------------------------

# 5. Query Key Convention

Use hierarchical keys.

Examples:

``` text
["users"]
["users", userId]
["courses"]
["courses", courseId]
["contests", contestId, "ranking"]
```

Stable and descriptive query keys are mandatory.

------------------------------------------------------------------------

# 6. Cache Strategy

Default approach:

-   Read from cache first
-   Synchronize with backend
-   Invalidate after successful mutations
-   Avoid manual cache manipulation unless justified

------------------------------------------------------------------------

# 7. Mutation Flow

``` mermaid
sequenceDiagram

User->>Component: Submit
Component->>Mutation
Mutation->>Backend
Backend-->>Mutation
Mutation->>Invalidate Query
Query->>Component
Component-->>User
```

------------------------------------------------------------------------

# 8. Retry Policy

Recommended:

-   Retry transient network failures
-   Do not retry validation errors (400)
-   Do not retry authorization failures (401/403)

------------------------------------------------------------------------

# 9. Pagination & Infinite Queries

Prefer:

-   Cursor pagination when available
-   Infinite queries only for infinite scrolling
-   Traditional pagination for management screens

------------------------------------------------------------------------

# 10. Zustand Responsibilities

Suitable examples:

-   Theme
-   Sidebar
-   Drawer
-   Toast preferences
-   UI filters that are not persisted

Avoid storing:

-   User lists
-   Contest data
-   Course data
-   Any API response

------------------------------------------------------------------------

# 11. React Local State

Use `useState` for:

-   Form inputs
-   Dialog visibility (local)
-   Temporary selections

Promote state only when multiple components genuinely need it.

------------------------------------------------------------------------

# 12. Decision Matrix

  Scenario                  Tool
  ------------------------- -----------------
  API data                  TanStack Query
  Theme                     Zustand
  Modal                     Zustand
  Search input              useState
  Form                      React Hook Form
  Cached backend resource   TanStack Query

------------------------------------------------------------------------

# 13. Anti-patterns

Never:

-   Duplicate server state in Zustand
-   Fetch with Axios directly in components
-   Store derived UI state globally
-   Invalidate all queries indiscriminately
-   Use global state for one component

------------------------------------------------------------------------

# 14. Review Checklist

-   [ ] Correct state owner selected
-   [ ] Query keys follow convention
-   [ ] Cache invalidation defined
-   [ ] No duplicated server state
-   [ ] Local state kept local
-   [ ] Global state minimized

------------------------------------------------------------------------

# Related Documents

-   frontend-architecture.md
-   api-communication.md
-   frontend-conventions.md
-   design-system.md
