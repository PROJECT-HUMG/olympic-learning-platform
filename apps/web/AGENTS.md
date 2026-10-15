# Repository Guidelines

## Project Structure & Module Organization

This SPA uses React 19, TypeScript, Vite 8, and Tailwind CSS 4.

- `src/features`: feature components, hooks, services, and types; `src/pages`: route screens.
- `src/router`: routes/guards; `src/layouts`: public, auth, and dashboard shells. `navigation.ts` owns destinations, role grouping, and active matching.
- `src/components/ui`: shared primitives; `src/index.css`: theme tokens; `src/assets` and `public`: assets.
- `tests`: Node regression tests and browser checks.

## Build, Test, and Development Commands

Run from `apps/web` using Node.js 24 and pnpm10.17.0 (matching the workflow/Docker build); prefix commands with `rtk`. `package.json`/the lockfile own the installed library versions; do not infer them from old generated rules.
If PATH selects another pnpm, use `rtk proxy corepack pnpm@10.17.0 <command>` rather than changing project dependencies to match the local tool.

- `rtk pnpm install --frozen-lockfile`: installs locked dependencies.
- `rtk pnpm dev`: serves port 3000; proxies `/api` to port 8080.
- `rtk pnpm build`: checks TypeScript and bundles production assets.
- `rtk pnpm lint`: runs Oxlint with `.oxlintrc.json`.
- `rtk pnpm preview`: serves the production build locally.

See [README.md](README.md) for setup; [browser checks](README.md#browser-checks) owns supported routed check names, shared options, isolation/cleanup and legacy boundaries. Use `rtk pnpm check:browser --list` rather than guessing runner setup.

## Coding Style & Naming Conventions

Match nearby two-space indentation, quoting, and semicolons. Use PascalCase components/types, camelCase functions, `use*` hooks, and kebab-case filenames. Use `@/` imports where appropriate.

Trace route → page → owning feature hook/service → shared `src/lib/axios.ts`; extend existing owners rather than creating each layer for every change. TanStack Query owns server state; invalidate affected queries after mutations. Local component state and existing Zustand stores have distinct scopes; do not require a global store for every drawer/form. Auth/session and Daily recovery/draft stores retain their explicit contracts, not a blanket ban on storing any server-derived value. Preserve the existing token/refresh flow; never hardcode secrets or production URLs.

Reuse shared form/field/action owners and RHF/Zod where they fit the flow; native/specialized controls such as CodeSlots keep their semantics. Client validation provides useful feedback and supported type/size/count checks; it does not replace backend validation. Reuse current Radix Dialog/Sheet/CreationDialog owners and preserve existing native dialog/player lifecycles; [dialog/media guidance](../../docs/ui/owners/dialogs-and-media.md) identifies the responsible frame. There is no universal native-`dialog` replacement requirement. Feature CSS and scoped dynamic styles are supported alongside Tailwind; use existing tokens/owners instead of imposing a blanket styling rewrite.

## Testing Guidelines

Use Node's test runner; name regressions `tests/*.test.ts`. Run `rtk proxy node --test --test-isolation=none tests/*.test.ts`, or a focused existing test for a bounded change. No numeric coverage gate is configured. Run build/lint for frontend implementation changes; inspect representative routed light/dark, responsive, keyboard/focus and relevant reduced-motion behavior for UI edits. A fixture component is not the actual routed page/shell. Report skipped checks; mocked browser APIs do not prove backend authorization/persistence.

## Commit & Pull Request Guidelines

Follow Conventional Commits, e.g. `feat(web): polish study controls`. Keep commits focused. PRs should describe behavior, link relevant issues, list validation, and include UI screenshots.

## UI & Data Invariants

Read [web UI conventions](../../docs/architecture/web-ui.md) before defining typography/colors. Reuse `PageHeader`, `PageSection`, `.page-shell`, tokens, and navigation drawers. Respect `prefers-reduced-motion`; keep content visible if animation fails. Startup loading belongs in `src/app/startup-preloader.ts`; later routes use `RouteSuspense`/`PageLoading`, with shared cinematic downloads.

Preserve filters/pagination/return paths through `src/lib/list-navigation.ts` and login targets through existing auth routing. Distinguish errors from empty data; provide feature-owned retries. Never present mock content as live data.

Questions retain `schemaVersion` 1 blocks, authenticated figures, and `/new` before `/:id`; never persist HTML/remote figure URLs. Student exams remain unavailable until release and exclude answers, explanations, and solution-only figures. Preserve unrelated work and synchronize API contracts/types/documentation.
