---
last_updated: 2026-07-21
owner: Olympic Engineering
status: Draft
title: Design System
version: 2
---

# Design System

> The Design System is the single source of truth for the visual
> language, interaction patterns, and reusable UI components of the
> Olympic Learning Platform.

> **Scope:** React + TypeScript + Tailwind CSS v4 + shadcn/ui + Radix UI

------------------------------------------------------------------------

# 1. Design Philosophy

## Core Principles

-   Consistency over creativity
-   Accessibility by default
-   Mobile-first responsive design
-   Dark mode is mandatory
-   Composition over customization
-   Semantic design tokens
-   Reusable before new

------------------------------------------------------------------------

# 2. Design Foundations

## Color Tokens

Never use hard-coded colors inside application components.

✅

``` tsx
className="bg-primary text-primary-foreground"
```

❌

``` tsx
className="bg-blue-500 text-white"
```

Semantic tokens include:

-   Primary
-   Secondary
-   Accent
-   Muted
-   Destructive
-   Success
-   Warning
-   Info

------------------------------------------------------------------------

## Typography

Hierarchy:

-   Display
-   H1
-   H2
-   H3
-   H4
-   Body Large
-   Body
-   Small
-   Caption

Rules:

-   One H1 per page
-   Preserve hierarchy
-   Avoid arbitrary font sizes

------------------------------------------------------------------------

## Spacing

Base unit: **4px**

Preferred scale:

4 → 8 → 12 → 16 → 24 → 32 → 48 → 64

Avoid arbitrary spacing values.

------------------------------------------------------------------------

## Radius

Use design tokens:

-   sm
-   md
-   lg
-   xl

------------------------------------------------------------------------

## Elevation

Use predefined shadow levels only.

------------------------------------------------------------------------

# 3. Responsive Strategy

Breakpoints:

-   Mobile
-   Tablet
-   Laptop
-   Desktop
-   Wide

Mobile-first is mandatory.

------------------------------------------------------------------------

# 4. Dark Mode

Requirements:

-   Every component supports dark mode.
-   Never maintain separate component implementations.
-   Colors come from semantic tokens only.

------------------------------------------------------------------------

# 5. Accessibility

Every interactive component must support:

-   Keyboard navigation
-   Focus ring
-   Visible disabled state
-   Semantic HTML
-   ARIA attributes where appropriate

Color alone must never communicate important information.

------------------------------------------------------------------------

# 6. Component Specification

Every shared component must document:

-   Purpose
-   Props
-   Variants
-   Sizes
-   States
-   Accessibility
-   Usage
-   Do
-   Don't

## Button

Variants:

-   default
-   secondary
-   outline
-   ghost
-   destructive
-   link

Sizes:

-   sm
-   default
-   lg
-   icon

States:

-   default
-   hover
-   active
-   disabled
-   loading

Rules:

-   One primary action per section.
-   Loading buttons remain disabled.
-   Icon-only buttons require an accessible label.

------------------------------------------------------------------------

## Input

Supports:

-   Label
-   Description
-   Placeholder
-   Validation message
-   Disabled
-   Readonly

Never rely on placeholders as labels.

------------------------------------------------------------------------

## Table

Requirements:

-   Responsive
-   Sortable
-   Pagination support
-   Empty state
-   Loading state
-   Error state

------------------------------------------------------------------------

## Dialog

Rules:

-   Trap keyboard focus
-   Close with ESC
-   Restore previous focus
-   Prevent background interaction

------------------------------------------------------------------------

## Toast

Variants:

-   Success
-   Error
-   Warning
-   Info

------------------------------------------------------------------------

# 7. Page States

Every feature should define:

-   Loading
-   Empty
-   Success
-   Error
-   403 Forbidden
-   404 Not Found

------------------------------------------------------------------------

# 8. Interaction Guidelines

Support consistent:

-   Hover
-   Focus
-   Active
-   Disabled
-   Loading
-   Transition

Avoid decorative animations that do not communicate state.

------------------------------------------------------------------------

# 9. Layout Guidelines

Use:

-   Consistent page container
-   12-column grid
-   Shared spacing tokens
-   Predictable section spacing

------------------------------------------------------------------------

# 10. Anti-patterns

Never:

-   Hard-code colors
-   Duplicate components
-   Use inline styles without justification
-   Mix business logic into shared UI
-   Create multiple visual styles for identical actions

------------------------------------------------------------------------

# 11. Review Checklist

-   [ ] Uses semantic color tokens
-   [ ] Supports dark mode
-   [ ] Responsive
-   [ ] Accessible
-   [ ] Reuses shared components
-   [ ] Proper loading/empty/error states
-   [ ] Consistent spacing
-   [ ] Typography hierarchy respected
-   [ ] No duplicated UI patterns

------------------------------------------------------------------------

# Future Expansion

This document will evolve into the complete Olympic UI specification,
including detailed specifications for every shared component, page
template, interaction pattern, motion guideline, and design token.

------------------------------------------------------------------------

# Related Documents

-   frontend-architecture.md
-   frontend-conventions.md
-   state-management.md
-   routing.md
-   api-communication.md
