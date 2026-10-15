---
name: olympic-context
description: Find the owning code and current documentation when starting an unfamiliar task in the Olympic Learning Platform repository. Use only for work in this repository.
---

# Olympic Learning Platform context

Use this map to find the right starting point. The root and app `AGENTS.md` files contain working rules; the READMEs contain setup commands. Verify documentation against current code when they disagree.

## Start here

1. Read the root `AGENTS.md`, inspect `git status`, and choose the affected app.
2. Read that app's `AGENTS.md` and relevant setup in its `README.md`. For a named product feature (Vietnamese UI name or code alias), search the **Feature lookup** in `docs/README.md`; open only its linked owner/contract and focused check. Use `docs/reviews/ux-flow-audit.md` for current checkpoint/pending state and material proof limits. Old execution history lives in Git; do not recreate a history tree or compatibility tracker.
3. Follow the linked source/test directly. Use `docs/architecture/README.md` only for the relevant cross-feature contract (auth includes OTP/mail; the identity UI owner includes avatar storage/crop). Trace the actual route/request and consumers before changing behavior.

## Code map

| Task area | First places to inspect |
| --- | --- |
| API endpoint or business rule | `apps/api/src/main/java/me/nghlong3004/olympic/<module>`: controller → service → repository/mapper/entity |
| API schema or runtime setup | `apps/api/src/main/resources/db/migration`, `apps/api/src/main/resources/application*.yaml`, root `compose*.yml` |
| Authentication and authorization | API `auth`, `user`, `admin`, `common/security`; web `src/router/guards`, `src/stores/use-auth-store.ts`, `src/lib/axios.ts` |
| Web route or screen | `apps/web/src/router/routes.tsx`, `route-constants.ts`, then `src/pages`, `src/layouts`, and the owning `src/features/<feature>` |
| Web data flow | Feature hook/service/types, TanStack Query in `src/lib/query-client.ts`, shared Axios client in `src/lib/axios.ts` |
| Web visual design | `apps/web/src/index.css`, `src/components/ui`, affected feature CSS/components |

For Home content, trace mounted `apps/web/src/pages/home-page.tsx` → HomeStudyNotebook/useHomeNews to document/post queries. `home-mock-data.ts` belongs to unmounted legacy widgets; do not treat it as the active Home data owner. The feature lookup marks guidance-only practice/history/competition pages explicitly; older draft module lists are not implemented capability. For Java edits, the API `AGENTS.md` points to the required backend style skill.
