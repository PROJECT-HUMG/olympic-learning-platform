# Web working guide

## Current state

- React 19, TypeScript, Vite 8, and Tailwind CSS 4. UI primitives live in `src/components/ui`, feature code in `src/features`, pages in `src/pages`, and shells in `src/layouts`.
- Routes and guards live in `src/router`. `PublicLayout`, `AuthCardLayout`, and `DashboardLayout` separate the main surfaces. TanStack Query owns server state; `src/lib/axios.ts` is the shared API client; Zustand holds client state such as auth, theme, season, and UI preferences.
- Theme tokens live in `src/index.css`, with light and dark modes. Some home-page sections use sample data from `src/features/home/data/home-mock-data.ts`; the latest-news section fetches posts from the API.
- Available commands are `pnpm dev`, `pnpm build`, `pnpm lint`, and `pnpm preview`. Vite serves on port 3000 and proxies `/api` to port 8080.

## Working practices

1. Trace the flow from `route → page → feature component/hook → service → apiClient`. Keep fetching and mutations in the owning feature, and invalidate affected queries after server data changes.
2. Reuse existing tokens and UI primitives where they fit. Preserve routes, navigation labels, focus and keyboard behavior, dark mode, and responsive layouts. Never present sample content as live data.
3. Motion should support the content, respect `prefers-reduced-motion`, and leave content visible when animation or JavaScript is limited. Prefer CSS over page-wide listeners or unnecessary continuous animation.
4. Keep the access-token and refresh flow in the existing client/store. Avoid separate Axios calls that bypass it without a concrete reason. Do not hardcode production secrets or backend URLs.
5. Run `pnpm build` and `pnpm lint` for frontend changes. When changing UI, inspect light/dark mode, mobile layout, keyboard navigation, and reduced motion where possible.

See [README.md](README.md) for setup and commands.
