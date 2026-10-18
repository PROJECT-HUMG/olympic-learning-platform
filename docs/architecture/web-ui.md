# HUMG UI rules

Use [named features](../README.md#feature-lookup) for a screen and [UI owners](../ui/README.md) for shared behavior. The mature HUMG language is restrained university/product UI: readable Vietnamese, clear hierarchy/alignment, compact rhythm and useful surfaces. Landing-page defaults do not govern admin tables, forms or readers.

## Responsible foundations

[Theme tokens](../../apps/web/src/index.css), [page layout CSS](../../apps/web/src/components/ui/page-layout.css), PageHeader/PublicPageHeader/PageSection and existing primitives own shared type, gutters, measure, spacing, borders, radii and semantic colors. Keep existing brand/font/system fallbacks. Do not introduce a parallel card kit, redundant wrapper or dependency to restyle a feature.

- Align headings/actions and search/filter groups. Use quiet borders/surface contrast; avoid oversized rounded panels, double filter framing, decorative gloss and empty bands. Distinct Home/auth/readers/room/editor compositions are intentional.
- Real anchors navigate; buttons act. Preserve discoverable touch/keyboard behavior without hover, 44px control targets, visible focus, labels/current/pressed states and honest loading/error/empty/retry feedback. Long names/titles wrap; density must not hide identity or actions.
- List searching uses the existing 350ms feature hook where supported; discrete filters apply immediately. Keep field-specific matching, server pagination, URL/history, IME and stale-state behavior. Home navigation search and save/auth/OTP/publish forms remain explicit; no auto-submission or global SearchInput query ownership.
- Public identities/summaries show only authorized real DTO data. Actual ranks/ties remain supplied ranks. No decorative podium, fabricated totals or guessed media previews.
- Use responsive/light-dark tokens; test narrow/short geometry and relevant long/error/busy/dirty states. Native scrolling remains usable; forced-colors uses browser defaults.

## Motion and media

Use scoped existing GSAP/@gsap/react, Framer Motion or CSS at their actual owners. Keep readable semantic/native fallback content and static reduced-motion output; revert observers/listeners/tweens on unmount/identity change. Avoid replay on refetch, rank/count animation or competing transforms on portal/modal positioning wrappers.

Home uses actual MaskedHeading plus one original theme-selected ambient scene; static logo remains. Auth retains original desktop scene/form rails and mobile no-video layout, with no visible motion toggle. Blocked autoplay/media failures retain posters. [Home/motion owners](../ui/owners/home-registry-and-motion.md) own details.

Initial readiness releases real content as soon as task/query/font state permits, including readable error/reload recovery. The short opacity exit is nonblocking; no fake percentage, minimum wait, completion hold, scroll-trigger loading wrapper or extra gate.

## Frames and task variants

Shared Radix/native owners provide focus/Escape/scroll behavior; features own permissions, dirty/busy dismissal and state retention. Keep fixed inset/zero-translation CreationDialog geometry, its one scrolling body and reachable Close beside toasts. Do not animate frame centering. [Dialog/media owners](../ui/owners/dialogs-and-media.md) describe nested controls and private viewers.

Room uses a non-3D clock/team workspace, local lighting and one deliberately activated inline player; playback remains device-local. Scientific readers/editors keep notation overflow, private figures and frozen/release policies; do not force them into marketing/card layouts.

The Documents card remains unchanged pending a compact balanced composition decision. “Chưa có ảnh” is valid wording; missing-preview space should be integrated, not automatically replaced with an icon. Use actual image/no-image/error/long-title states when that change is authorized.

## Verification

[Focused owner checks](../ui/README.md) and [current status/limits](../reviews/ux-flow-audit.md) identify usable evidence. Inspect actual rendered hierarchy as well as tests. Synthetic screenshots/layout viewports do not establish physical keyboards, AT speech, live authorization/provider behavior, media quality or production performance. Preserve and check relevant reduced-motion fallback behavior proportionately.
