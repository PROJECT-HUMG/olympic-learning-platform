---
name: olympic-context
description: Find the owning code and current documentation when starting an unfamiliar task in the Olympic Learning Platform repository. Use only for work in this repository.
---

# Olympic Learning Platform context

Use this map to find the right starting point. The root and app `AGENTS.md` files contain working rules; the READMEs contain setup commands. Verify documentation against current code when they disagree.

## Start here

1. Read the root `AGENTS.md`, inspect `git status`, and choose the affected app.
2. Read that app's `AGENTS.md` and `README.md`. Use `docs/architecture` for design intent where relevant.
3. Trace the actual route or request to its data owner and consumers before changing behavior.

## Code map

| Task area | First places to inspect |
| --- | --- |
| API endpoint or business rule | `apps/api/src/main/java/me/nghlong3004/olympic/<module>`: controller → service → repository/mapper/entity |
| API schema or runtime setup | `apps/api/src/main/resources/db/migration`, `apps/api/src/main/resources/application*.yaml`, root `compose*.yml` |
| Authentication and authorization | API `auth`, `user`, `admin`, `common/security`; web `src/router/guards`, `src/stores/use-auth-store.ts`, `src/lib/axios.ts` |
| Web route or screen | `apps/web/src/router/routes.tsx`, `route-constants.ts`, then `src/pages`, `src/layouts`, and the owning `src/features/<feature>` |
| Web data flow | Feature hook/service/types, TanStack Query in `src/lib/query-client.ts`, shared Axios client in `src/lib/axios.ts` |
| Web visual design | `apps/web/src/index.css`, `src/components/ui`, affected feature CSS/components |

For home-page content, check `apps/web/src/features/home/data/home-mock-data.ts` before assuming displayed values come from the API. For Java edits, the API `AGENTS.md` points to the required backend style skill.
