# Repository Guidelines

## Project Structure & Module Organization

This SPA uses React 19, TypeScript, Vite 8, and Tailwind CSS 4.

- `src/features`: feature components, hooks, services, and types; `src/pages`: route screens.
- `src/router`: routes/guards; `src/layouts`: public, auth, and dashboard shells. `navigation.ts` owns destinations, role grouping, and active matching.
- `src/components/ui`: shared primitives; `src/index.css`: theme tokens; `src/assets` and `public`: assets.
- `tests`: Node regression tests and browser checks.

## Build, Test, and Development Commands

Run from `apps/web` using Node.js 24 and pnpm; prefix commands with `rtk`.

- `rtk pnpm install --frozen-lockfile`: installs locked dependencies.
- `rtk pnpm dev`: serves port 3000; proxies `/api` to port 8080.
- `rtk pnpm build`: checks TypeScript and bundles production assets.
- `rtk pnpm lint`: runs Oxlint with `.oxlintrc.json`.
- `rtk pnpm preview`: serves the production build locally.

See [README.md](README.md) for setup and browser checks.

## Coding Style & Naming Conventions

Match nearby two-space indentation, quoting, and semicolons. Use PascalCase components/types, camelCase functions, `use*` hooks, and kebab-case filenames. Use `@/` imports where appropriate.

Trace route → page → feature hook/service → shared `src/lib/axios.ts`. TanStack Query owns server state; invalidate affected queries after mutations. Zustand holds client state. Preserve the existing token/refresh flow; never hardcode secrets or production URLs.

## Testing Guidelines

Use Node's test runner; name regressions `tests/*.test.ts`. Run `rtk proxy node --test --test-isolation=none tests/*.test.ts`. No numeric coverage gate is configured. Run build/lint for frontend changes; check light/dark modes, mobile/tablet layouts, keyboard focus, and reduced motion for UI edits. Report skipped checks; mocked browser APIs do not prove backend authorization/persistence.

## Commit & Pull Request Guidelines

Follow Conventional Commits, e.g. `feat(web): polish study controls`. Keep commits focused. PRs should describe behavior, link relevant issues, list validation, and include UI screenshots.

## UI & Data Invariants

Read [web UI conventions](../../docs/architecture/web-ui.md) before defining typography/colors. Reuse `PageHeader`, `PageSection`, `.page-shell`, tokens, and navigation drawers. Respect `prefers-reduced-motion`; keep content visible if animation fails. Startup loading belongs in `src/app/startup-preloader.ts`; later routes use `RouteSuspense`/`PageLoading`, with shared cinematic downloads.

Preserve filters/pagination/return paths through `src/lib/list-navigation.ts` and login targets through existing auth routing. Distinguish errors from empty data; provide feature-owned retries. Never present mock content as live data.

Questions retain `schemaVersion` 1 blocks, authenticated figures, and `/new` before `/:id`; never persist HTML/remote figure URLs. Student exams remain unavailable until release and exclude answers, explanations, and solution-only figures. Preserve unrelated work and synchronize API contracts/types/documentation.
