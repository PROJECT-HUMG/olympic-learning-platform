# Web working guide

## Current state

- React 19, TypeScript, Vite 8, and Tailwind CSS 4. UI primitives live in `src/components/ui`, feature code in `src/features`, pages in `src/pages`, and shells in `src/layouts`.
- Routes and guards live in `src/router`. `PublicLayout`, `AuthCardLayout`, and `DashboardLayout` separate the main surfaces. TanStack Query owns server state; `src/lib/axios.ts` is the shared API client; Zustand holds client state such as auth, theme, and UI preferences.
- Theme tokens live in `src/index.css`, with light and dark modes. The mounted home page fetches documents and posts from the API; legacy sample sections referencing `home-mock-data.ts` are not mounted.
- `src/layouts/navigation.ts` owns navigation groups, role-specific items and active-route matching. Public desktop navigation floats from 1280px; smaller screens use a grouped header sheet. Dashboard sidebar behavior belongs to `dashboard-layout.tsx` and `navigation.css`.
- The initial logo loader starts in `index.html`; `src/app/startup-preloader.ts` waits for initial route tasks, pending initial queries, fonts and the selected video before GSAP reveals the app. Later lazy routes use `RouteSuspense` and `PageLoading`. Video downloads are shared by `cinematic-media.ts`; mobile auth skips video. Cinematic scenes respect reduced motion by default; home explicitly uses the remembered manual motion preference instead.
- Available commands are `pnpm dev`, `pnpm build`, `pnpm lint`, and `pnpm preview`. Vite serves on port 3000 and proxies `/api` to port 8080.
- Manual questions live in `src/features/questions` at `/lecturer/questions` and `/admin/questions`, with `/new` registered before `/:id`. Content is `schemaVersion` 1 scientific blocks and must not persist HTML or remote figure URLs. Figure bytes come from the authenticated question-figure request, not a public URL. Prepared exams live in `src/features/exams`: staff drafts and papers at `/lecturer/exams` and `/admin/exams`, student papers at `/exams`. A student paper stays unavailable until release and must not render answer fields or solution-only figures.

## Working practices

1. Trace the flow from `route → page → feature component/hook → service → apiClient`. Keep fetching and mutations in the owning feature, and invalidate affected queries after server data changes.
2. Reuse existing tokens and UI primitives where they fit. Functional screens share `PageHeader`, `PageSection` and `.page-shell`; see `docs/architecture/web-ui.md` from the repository root before defining page-specific typography or colors. Preserve routes, navigation labels, focus and keyboard behavior, dark mode, and responsive layouts. Never present sample content as live data.
3. Motion should support the content, respect `prefers-reduced-motion`, and leave content visible when animation or JavaScript is limited. Prefer CSS over page-wide listeners or unnecessary continuous animation.
4. Keep the access-token and refresh flow in the existing client/store. Avoid separate Axios calls that bypass it without a concrete reason. Do not hardcode production secrets or backend URLs.
5. Run `pnpm build` and `pnpm lint` for frontend changes. When changing UI, inspect light/dark mode, mobile layout, keyboard navigation, and reduced motion where possible.
6. Preserve URL filters, pagination and list return paths using `src/lib/list-navigation.ts`; keep login return targets in the existing router/auth flow. Distinguish empty data from request errors, and keep retry actions in the owning feature. Node tests live in `tests/*.test.ts`; see README for the command.

See [README.md](README.md) for setup and commands.
