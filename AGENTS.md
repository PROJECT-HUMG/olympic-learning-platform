# Repository working guide

## Current state

- This repository contains two applications: `apps/api` (Spring Boot 4.0.7, Java 25, Maven) and `apps/web` (React 19, TypeScript, Vite 8, Tailwind CSS 4, pnpm).
- The API is organized into business modules under `me.nghlong3004.olympic`: auth, user, admin, document, post, topic, question, assessment, storage, and common. PostgreSQL is the primary data store, Flyway owns schema changes, and Redis supports token-related flows and the assessment import queue.
- The web app is a React Router SPA. TanStack Query owns server state, Zustand holds selected client state, and `src/lib/axios.ts` is the shared API client. It has public, auth, and role-specific dashboard areas.
- `compose.dev.yml` runs PostgreSQL, Redis, and Mailpit; `compose.yml` also runs the API and web app. `docs/architecture` contains design documents that may be older than the implementation. Verify behavior against the current code and configuration.
- The mounted home page reads documents and posts from the API. Legacy home components still reference `apps/web/src/features/home/data/home-mock-data.ts` but are not mounted by `HomePage`; do not present those samples as live platform data.

## Working practices

1. Read the applicable `apps/api/AGENTS.md` or `apps/web/AGENTS.md` before changing an application. Before creating or modifying any Java file under `apps/api`, also read `.agents/skills/backend/SKILL.md`.
2. Trace the relevant request, authorization, state, and data flow before changing behavior. Make the change in the owning module. Keep API contracts and routes stable unless the task requires a change.
3. Inspect `git status` and the relevant diff before and after editing. Preserve unrelated uncommitted work. Never commit secrets; document environment variable names only.
4. Add a new Flyway migration for schema changes; do not rewrite applied migrations. When changing an API contract, update the corresponding web service/types and documentation.
5. Run the smallest meaningful verification: relevant API tests (or `./mvnw test`), and `pnpm build` plus `pnpm lint` for web changes. Report checks that could not run.
6. Prefix shell commands with `rtk` as required by `/home/nghlong3004/.codex/RTK.md`; use `rtk proxy` when raw output is needed.

For a new session or unfamiliar task, use `.agents/skills/olympic-context/SKILL.md` to locate the owning code and current sources. Setup details: [root README](README.md), [API README](apps/api/README.md), [web README](apps/web/README.md).
