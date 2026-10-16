# Repository Guidelines

For a named feature, start with [the feature lookup](docs/README.md#feature-lookup),
then its source/contract/check and the affected app's `AGENTS.md`. Root/app guides
own scoped working rules; the two `.agents/skills` provide conditional discovery
and Java guidance. Read [the local workspace guidance](docs/WORKSPACE_PROTOCOL.md)
alongside the shared contract; it does not replace role or safety authority.

## Project Structure & Module Organization

- `apps/api`: Spring Boot 4.0.7/Java 25 API. Business modules live under `src/main/java/me/nghlong3004/olympic`; tests in `src/test/java`; Flyway migrations in `src/main/resources/db/migration`.
- `apps/web`: React 19/TypeScript, Vite 8, Tailwind CSS 4. Organize screens under `src/features`, routes under `src/router`, shared UI under `src/components/ui`; tests in `tests`, assets in `src/assets` and `public`.
- `docs/architecture`: design references; verify against implementation. See root and app READMEs for setup.

## Build, Test, and Development Commands

Use RTK’s fitting filters for supported shell commands and `caveman tools shrink -- <command>` for other verbose output. Run short commands directly. Never stack compression; recover omitted output using the respective tool’s recovery handle when exact verification is needed. `rtk proxy` is passthrough, not additional compression. Do not assume hooks compress commands automatically.

- Root: `docker compose -f compose.dev.yml up -d` starts PostgreSQL, Redis, and Mailpit.
- In `apps/api`: `./mvnw spring-boot:run` starts the API; `./mvnw test` runs tests; `./mvnw package` tests and builds.
- In `apps/web`: `pnpm install --frozen-lockfile`, then `pnpm dev` starts Vite. `pnpm build` checks TypeScript and bundles; `pnpm lint` runs Oxlint.

## Coding Style & Naming Conventions

Read the affected app's `AGENTS.md` first; read `.agents/skills/backend/SKILL.md` before any Java edit. Java follows Google Java Style/Google Java Format as detailed there; web components generally use two spaces and nearby conventions. Use PascalCase classes/components, camelCase methods/functions, and kebab-case web filenames.

Keep API business rules in services and expose request/response DTOs. Web server state belongs to TanStack Query; use the shared `src/lib/axios.ts` client. Reuse UI primitives and theme tokens; preserve accessibility, dark mode, and responsive layouts.

## Testing Guidelines

API tests use JUnit Jupiter and Spring testing; name classes `*Test.java`. Testcontainers integration tests require Docker. Select tests with `./mvnw -Dtest=StudyRoomRulesTest test`.

Web tests use Node's test runner: `node --test --test-isolation=none tests/*.test.ts` from `apps/web`. No numeric coverage gate is configured. Select meaningful checks for the changed behavior/risk, including authorization failures when affected; run web build/lint for web implementation changes and report skipped checks. Guidance-only edits need path/link/structure checks, not an unrelated application-suite rerun. The broader delivery checks live in `.github/workflows/delivery.yml`.

## Commit & Pull Request Guidelines

Follow history's Conventional Commits, e.g. `feat(web): polish study controls`. Keep commits focused. PRs should explain behavior, link relevant issues, list validation, and include screenshots for UI changes.

## Security & Contributor Workflow

Inspect status/diffs; preserve unrelated work. Trace authorization and data flow before editing. Never commit secrets. Add migrations rather than rewriting applied ones; synchronize API contracts, web types/services, and documentation. Preserve frozen exam papers and release-time access restrictions. Never present mock content as live data. Use `.agents/skills/olympic-context/SKILL.md` for unfamiliar tasks. See the [workspace protocol](docs/WORKSPACE_PROTOCOL.md) for scope and evidence rules.
