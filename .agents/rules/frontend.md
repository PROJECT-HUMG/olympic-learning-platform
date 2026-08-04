---
trigger: always_on
---

# Frontend Rules

## Purpose

These are mandatory rules for every generated frontend code.

When a rule conflicts with generated code, the rule always wins.

---

# Stack

Always assume the project uses

- React 19+
- TypeScript (Strict)
- Vite
- pnpm
- Tailwind CSS v4
- shadcn/ui
- Radix UI
- TanStack Query v5
- Zustand
- React Hook Form
- Zod v4
- Axios
- Sonner
- Lucide Icons
- Framer Motion

Generate code only compatible with these versions.

Never use deprecated APIs.

---

# Architecture

Follow Feature-first Architecture.

Business logic belongs inside features.

Pages compose features.

Features compose reusable components.

Services communicate with backend.

Components render UI.

Never violate the following flow

Page

↓

Feature

↓

Hook

↓

Service

↓

Axios

↓

Backend

---

# Responsibilities

## Page

Responsible for

- Layout composition
- Route composition

Never

- Fetch API
- Write business logic
- Validate business rules

---

## Feature

Responsible for

- Business UI
- Business logic
- Feature composition

Never

- Communicate directly with Axios

---

## Hook

Responsible for

- React Query
- Mutations
- Local business interaction

Never

- Render UI

---

## Service

Responsible for

- HTTP communication only

Never

- Import React
- Use React Query
- Render UI

---

## Components

Responsible for

- Presentation only

Must

- Receive data via props
- Be reusable

Never

- Fetch API
- Own business rules

---

# State Management

Server State

Always use

TanStack Query

Examples

- User
- Post
- Subject
- Contest

Never duplicate server state inside Zustand.

UI State

Always use

Zustand

Examples

- Sidebar
- Theme
- Drawer
- Dialog

Never store API resources inside Zustand.

Temporary UI state

Always use

React useState.

---

# React Query

Always

- Use object syntax
- Use hierarchical query keys
- Invalidate affected queries only
- Fetch through services

Never

- Call Axios directly
- Duplicate cache
- Use useEffect for API fetching

---

# Forms

Always use

React Hook Form

+

Zod v4

Validation

Frontend

UX only

Backend

Final authority

Never duplicate backend validation logic.

---

# API

All requests must follow

Hook

↓

Service

↓

Axios Instance

Never

- fetch()
- Axios inside components
- Hardcoded URLs

---

# Components

Components should

- Have one responsibility
- Stay below ~200 lines when practical
- Prefer composition
- Be reusable

Before creating a component

1. Search existing components.

2. Reuse if possible.

3. Extend if needed.

4. Create only when necessary.

---

# Styling

Always

- Tailwind CSS v4
- shadcn/ui

Support

- Dark mode
- Responsive
- Accessibility

Never

- Inline styles unless unavoidable

---

# Dialog

Use native

<dialog>

with

showModal()

Do not implement custom modal systems unless explicitly requested.

---

# Routing

Always

- Lazy load pages
- Use centralized route definitions
- Use layouts
- Use route guards

Never

- Hardcode URLs
- Define routing inside pages

---

# Naming

Components

PascalCase

Hooks

useXxx

Types

PascalCase

Interfaces

PascalCase

Enums

PascalCase

Variables

camelCase

Constants

UPPER_SNAKE_CASE

Files

kebab-case

---

# TypeScript

Always

- Strict mode
- Explicit types

Avoid

- any
- ts-ignore
- non-null assertion

Unless explicitly required.

---

# Accessibility

Support

- Keyboard navigation
- Focus management
- Semantic HTML
- Screen readers

Accessibility is mandatory.

---

# Performance

Prefer

- Route lazy loading
- Pagination
- Memoization only when justified

Never optimize prematurely.

---

# Scope

Only modify files required by the requested task.

Never

- Refactor unrelated modules
- Rename files
- Introduce new libraries

unless explicitly requested.

---

# Before Finishing

Verify

✓ Architecture respected

✓ Feature-first respected

✓ React Query used correctly

✓ Zustand only for UI state

✓ RHF + Zod used

✓ Axios only inside services

✓ Loading handled

✓ Empty state handled

✓ Error state handled

✓ Responsive

✓ Accessible

✓ Dark mode

✓ No TypeScript errors

✓ No lint errors

✓ No unused imports