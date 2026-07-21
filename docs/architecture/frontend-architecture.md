---
last_updated: 2026-07-21
owner: Olympic Engineering
status: Draft
title: Frontend Architecture
version: 1
---

# Frontend Architecture

> This document defines the architecture, responsibilities, and
> engineering principles for the Olympic Learning Platform frontend.

------------------------------------------------------------------------

# 1. Purpose

The frontend architecture aims to provide:

-   Maintainability
-   Scalability
-   Consistent user experience
-   Predictable project structure
-   AI-friendly development

------------------------------------------------------------------------

# 2. Technology Stack

  Component         Decision
  ----------------- ----------------------
  Framework         React
  Language          TypeScript
  Build Tool        Vite
  Package Manager   pnpm
  Styling           Tailwind CSS v4
  Forms             React Hook Form
  Validation        Zod
  Server State      TanStack Query
  UI State          Zustand
  HTTP Client       Axios
  UI Library        shadcn/ui + Radix UI
  Icons             Lucide
  Notifications     Sonner
  Animation         Framer Motion

------------------------------------------------------------------------

# 3. Architectural Style

The frontend follows:

-   Feature-first organization
-   Component composition
-   Route-level code splitting
-   Separation of concerns
-   Server/UI state separation

------------------------------------------------------------------------

# 4. High-Level Architecture

``` mermaid
flowchart LR

Browser --> Router
Router --> Page
Page --> Feature
Feature --> Service
Service --> Axios
Axios --> RESTAPI[(Spring Boot API)]
```

------------------------------------------------------------------------

# 5. Folder Structure

``` text
src/
├── app/
├── assets/
├── components/
├── features/
├── hooks/
├── layouts/
├── lib/
├── pages/
├── router/
├── services/
├── stores/
├── types/
├── utils/
└── styles/
```

Business logic belongs inside **features**, not shared components.

------------------------------------------------------------------------

# 6. Layer Responsibilities

  Layer       Responsibility
  ----------- -------------------------
  Router      Navigation
  Page        Route composition
  Feature     Business UI & use cases
  Component   Reusable UI
  Service     API communication
  Store       UI state
  Query       Server state

------------------------------------------------------------------------

# 7. Component Hierarchy

``` mermaid
flowchart TD

Page --> Feature
Feature --> SharedComponent
SharedComponent --> PrimitiveUI
```

Each layer should only depend on the layer directly beneath it.

------------------------------------------------------------------------

# 8. Data Flow

``` mermaid
flowchart LR

RESTAPI --> Axios
Axios --> TanStackQuery
TanStackQuery --> Feature
Feature --> Component
Component --> User
```

Components should consume data through hooks or feature logic, never
call Axios directly.

------------------------------------------------------------------------

# 9. State Management

State responsibilities:

## TanStack Query

-   API cache
-   Synchronization
-   Background refetch
-   Pagination
-   Mutations

## Zustand

-   Theme
-   Sidebar
-   Modal
-   Drawer
-   UI preferences

Server data must never be duplicated into Zustand.

------------------------------------------------------------------------

# 10. API Layer

All HTTP communication flows through:

``` text
Component
    ↓
Feature
    ↓
Service
    ↓
Axios Instance
    ↓
REST API
```

Benefits:

-   Centralized interceptors
-   Consistent error handling
-   Easier testing

------------------------------------------------------------------------

# 11. Routing

Routing principles:

-   Lazy load routes
-   Protect authenticated routes
-   Separate public/private layouts
-   Keep route definitions centralized

------------------------------------------------------------------------

# 12. Forms & Validation

Forms use:

-   React Hook Form
-   Zod

Validation strategy:

-   Client validation for UX
-   Backend validation for security

------------------------------------------------------------------------

# 13. Error Handling

Frontend should handle:

-   RFC7807 Problem Details
-   Authentication failures
-   Network failures
-   Validation errors
-   Unexpected errors

Never expose raw backend exceptions to users.

------------------------------------------------------------------------

# 14. Performance Principles

-   Route-level lazy loading
-   Memoize only when justified
-   Avoid unnecessary re-renders
-   Use pagination
-   Virtualize large lists if necessary
-   Optimize bundle size

------------------------------------------------------------------------

# 15. Accessibility

Every UI should support:

-   Keyboard navigation
-   Visible focus states
-   Semantic HTML
-   Screen readers
-   Sufficient color contrast

Accessibility is part of the default implementation.

------------------------------------------------------------------------

# 16. Anti-patterns

Avoid:

-   Axios inside components
-   Server state in Zustand
-   Business logic inside UI components
-   Massive page components
-   Hard-coded API URLs
-   Duplicate validation rules

------------------------------------------------------------------------

# 17. Frontend Review Checklist

-   [ ] Feature-first structure followed
-   [ ] Route is lazy loaded
-   [ ] API calls use service layer
-   [ ] Server state uses TanStack Query
-   [ ] UI state uses Zustand
-   [ ] Forms use RHF + Zod
-   [ ] Components are reusable
-   [ ] Accessibility considered
-   [ ] Dark mode supported
-   [ ] No architectural violations

------------------------------------------------------------------------

# Related Documents

-   state-management.md
-   api-communication.md
-   frontend-conventions.md
-   routing.md
-   design-system.md
-   backend-architecture.md
