# Repository Guidelines

## Project Structure & Module Organization

- `apps/api`: Spring Boot 4.0.7/Java 25 API. Business modules live under `src/main/java/me/nghlong3004/olympic`; tests in `src/test/java`; Flyway migrations in `src/main/resources/db/migration`.
- `apps/web`: React 19/TypeScript, Vite 8, Tailwind CSS 4. Organize screens under `src/features`, routes under `src/router`, shared UI under `src/components/ui`; tests in `tests`, assets in `src/assets` and `public`.
- `docs/architecture`: design references; verify against implementation. See root and app READMEs for setup.

## Build, Test, and Development Commands

Prefix shell commands with `rtk`; use `rtk proxy` for unsupported commands.

- Root: `rtk proxy docker compose -f compose.dev.yml up -d` starts PostgreSQL, Redis, and Mailpit.
- In `apps/api`: `rtk proxy ./mvnw spring-boot:run` starts the API; `rtk proxy ./mvnw test` runs tests; `rtk proxy ./mvnw package` tests and builds.
- In `apps/web`: `rtk pnpm install --frozen-lockfile`, then `rtk pnpm dev` starts Vite. `rtk pnpm build` checks TypeScript and bundles; `rtk pnpm lint` runs Oxlint.

## Coding Style & Naming Conventions

Read the affected app's `AGENTS.md` first; read `.agents/skills/backend/SKILL.md` before any Java edit. Match nearby indentation; web components generally use two spaces. Use PascalCase classes/components, camelCase methods/functions, and kebab-case web filenames.

Keep API business rules in services and expose request/response DTOs. Web server state belongs to TanStack Query; use the shared `src/lib/axios.ts` client. Reuse UI primitives and theme tokens; preserve accessibility, dark mode, and responsive layouts.

## Testing Guidelines

API tests use JUnit Jupiter and Spring testing; name classes `*Test.java`. Testcontainers integration tests require Docker. Select tests with `rtk proxy ./mvnw -Dtest=StudyRoomRulesTest test`.

Web tests use Node's test runner: `rtk proxy node --test --test-isolation=none tests/*.test.ts` from `apps/web`. No numeric coverage gate is configured. Cover changed behavior and authorization failures; run web build/lint and report skipped checks.

## Commit & Pull Request Guidelines

Follow history's Conventional Commits, e.g. `feat(web): polish study controls`. Keep commits focused. PRs should explain behavior, link relevant issues, list validation, and include screenshots for UI changes.

## Security & Contributor Workflow

Inspect status/diffs; preserve unrelated work. Trace authorization and data flow before editing. Never commit secrets. Add migrations rather than rewriting applied ones; synchronize API contracts, web types/services, and documentation. Preserve frozen exam papers and release-time access restrictions. Never present mock content as live data. Use `.agents/skills/olympic-context/SKILL.md` for unfamiliar tasks. See the [workspace protocol](docs/WORKSPACE_PROTOCOL.md) for scope and evidence rules.
