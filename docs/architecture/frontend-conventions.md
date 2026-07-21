---
last_updated: 2026-07-21
owner: Olympic Engineering
status: Draft
title: Frontend Conventions
version: 1
---

# Frontend Conventions

> Mandatory engineering conventions for every frontend feature in the
> Olympic Learning Platform.

------------------------------------------------------------------------

# 1. Purpose

These conventions ensure:

-   Consistent architecture
-   Readable code
-   Predictable reviews
-   AI-friendly code generation
-   Long-term maintainability

When multiple solutions are valid, follow this document.

------------------------------------------------------------------------

# 2. General Principles

Mandatory principles:

-   Functional Components only
-   Composition over inheritance
-   Feature-first organization
-   Convention over configuration
-   Single Responsibility Principle
-   Keep components small and focused

------------------------------------------------------------------------

# 3. Project Structure

``` text
src/
├── app/
├── components/
├── features/
├── layouts/
├── pages/
├── router/
├── services/
├── stores/
├── hooks/
├── lib/
├── utils/
└── types/
```

Business code belongs in `features/`.

------------------------------------------------------------------------

# 4. Component Convention

Components should:

-   Have one responsibility
-   Be reusable
-   Receive data through props
-   Avoid business logic

Avoid components exceeding \~200 lines without good reason.

------------------------------------------------------------------------

# 5. Feature Convention

Each feature owns:

-   Components
-   Hooks
-   Services
-   Query hooks
-   Types
-   Validation schemas

Cross-feature dependencies should be minimized.

------------------------------------------------------------------------

# 6. Hooks Convention

Custom hooks:

-   Begin with `use`
-   Encapsulate reusable logic
-   Never render UI
-   Prefer feature-specific hooks before global hooks

------------------------------------------------------------------------

# 7. TypeScript Convention

Rules:

-   Enable strict mode
-   Avoid `any`
-   Prefer `type` for aliases
-   Use `interface` for extendable object contracts
-   Export explicit types

------------------------------------------------------------------------

# 8. React Query Convention

-   Query keys follow documented hierarchy
-   Mutations invalidate affected queries only
-   No duplicated server state
-   Fetch through services only

------------------------------------------------------------------------

# 9. Zustand Convention

Use Zustand only for UI state:

-   Theme
-   Sidebar
-   Dialog
-   Drawer
-   Preferences

Never store API resources.

------------------------------------------------------------------------

# 10. Styling Convention

-   Tailwind CSS only
-   Utility-first approach
-   Responsive-first
-   Dark mode supported by default
-   No inline styles unless unavoidable

------------------------------------------------------------------------

# 11. Forms

Use:

-   React Hook Form
-   Zod

Validation rules should remain consistent with backend contracts.

------------------------------------------------------------------------

# 12. Imports

Prefer:

-   Absolute imports
-   Barrel exports where appropriate
-   Group imports logically

Avoid circular dependencies.

------------------------------------------------------------------------

# 13. Performance

Prefer:

-   Lazy loading
-   Code splitting
-   Memoization only when measured
-   Stable keys in lists

Avoid premature optimization.

------------------------------------------------------------------------

# 14. Testing

Expect:

-   Component tests
-   Hook tests
-   Integration tests for critical flows

Test behaviour instead of implementation details.

------------------------------------------------------------------------

# 15. Anti-patterns

Never:

-   Call Axios in components
-   Put business logic into pages
-   Duplicate validation
-   Use global state unnecessarily
-   Disable TypeScript checks

------------------------------------------------------------------------

# 16. Pull Request Checklist

-   [ ] Feature structure respected
-   [ ] Components focused
-   [ ] Hooks reusable
-   [ ] Types explicit
-   [ ] No `any`
-   [ ] React Query used correctly
-   [ ] Zustand only for UI state
-   [ ] Tailwind conventions followed
-   [ ] Dark mode verified
-   [ ] Accessibility considered
-   [ ] Tests added
-   [ ] Documentation updated when architecture changes

------------------------------------------------------------------------

# Related Documents

-   frontend-architecture.md
-   state-management.md
-   api-communication.md
-   routing.md
-   design-system.md
