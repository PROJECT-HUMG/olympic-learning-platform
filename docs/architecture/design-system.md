---
last_updated: 2026-10-14
owner: Olympic Engineering
status: Draft
title: Design System
version: 2
---

> Current page composition: [14/10/2026 decisions](#whole-page-composition--14102026).


# Design System

> The Design System is the single source of truth for the visual
> language, interaction patterns, and reusable UI components of the
> Olympic Learning Platform.

> **Scope:** React + TypeScript + Tailwind CSS v4 + shadcn/ui + Radix UI

------------------------------------------------------------------------

# 1. Design Philosophy

## Core Principles

-   Consistency over creativity
-   Accessibility by default
-   Mobile-first responsive design
-   Dark mode is mandatory
-   Composition over customization
-   Semantic design tokens
-   Reusable before new

------------------------------------------------------------------------

# 2. Design Foundations

## Color Tokens & Gradients

Never use hard-coded colors inside application components. Always use semantic design tokens and CSS variables.

✅

``` tsx
className="bg-primary text-primary-foreground"
className="bg-gradient-to-r from-primary to-primary-hover"
```

❌

``` tsx
className="bg-[#00387b] text-white"
```

Semantic tokens include:

-   **Primary:** `#1e40af` (indigo blue) with smooth hover/active gradients
-   **Secondary:** Clean neutral tint with foreground contrast
-   **Accent Colors:**
    -   *Teal:* `#0d9488` (success, positive highlights, completed tasks)
    -   *Amber:* `#d97706` (warnings, notices, gold trophies)
    -   *Violet:* `#7c3aed` (premium badges, featured items, special tags)
    -   *Rose/Red:* `#dc2626` (destructive, danger, error feedback)
-   **Muted / Surface:** High-contrast neutral scales with fine-tuned dark mode counterparts
-   **Gradients:**
    -   `--gradient-primary`: `linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 85%, #6366f1) 100%)`
    -   `--gradient-accent`: `linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-violet) 100%)`
    -   `--gradient-subtle`: `linear-gradient(180deg, color-mix(in srgb, var(--muted) 40%, transparent) 0%, transparent 100%)`

------------------------------------------------------------------------

## Typography

Hierarchy:

-   Display: Serif (`Noto Serif`, `Instrument Serif`) for prominent editorial headers
-   H1 / Page Titles: `Be Vietnam Pro`, `font-semibold` or `clamp(1.75rem, 2.4vw, 2.25rem)`
-   H2: Section headings, 1.25rem – 1.5rem
-   H3: Card titles, 1rem – 1.125rem
-   Body: 0.875rem (14px), 1.5–1.7 line height
-   Small / Meta: 0.75rem (12px), uppercase tracking for badges and category chips

Rules:

-   One H1 per page (semantic structure)
-   Preserve hierarchy across screen sizes
-   Avoid arbitrary font sizes

------------------------------------------------------------------------

## Spacing

Base unit: **4px**

Preferred scale:

4 → 8 → 12 → 16 → 24 → 32 → 48 → 64

Avoid arbitrary spacing values.

------------------------------------------------------------------------

## Radius

Use design tokens:

-   sm: `0.375rem` (6px)
-   md: `0.5rem` (8px)
-   lg: `0.75rem` (12px)
-   xl: `1rem` (16px)
-   2xl: `1.25rem` (20px) — for modal panels, content cards, hero windows

------------------------------------------------------------------------

## Elevation & Depth

Olympic uses multi-layered shadow tokens and surface depth:

-   `--shadow-xs` / `--shadow-sm`: subtle input and button resting states
-   `--surface-shadow`: standard card elevation (`0 1px 3px ...`)
-   `--shadow-card-hover`: interactive card lift (`0 12px 28px -6px ...`)
-   `--shadow-xl` / `--shadow-2xl`: dialogs, drawers, and floating panels

------------------------------------------------------------------------

## Motion & Micro-interactions

Design guidelines for transitions and micro-interactions:

-   **Transitions:** Use `cubic-bezier(0.22, 1, 0.36, 1)` with `200ms`–`280ms` for organic spring feels
-   **Hover Lift:** Interactive cards elevate on hover with `translateY(-2px)` to `translateY(-4px)`
-   **Button Press:** Active buttons scale down subtly (`scale(0.98)`) for tactile feedback
-   **Loading Skeleton:** Shimmer animation (`animate-shimmer`) with gradient sweep instead of flat pulse
-   **Page Entrance:** Content enters with smooth fade-up (`animate-page-enter`)
-   **Accessibility:** Respect `prefers-reduced-motion` at all times (animations degrade gracefully to instant transitions)

------------------------------------------------------------------------

------------------------------------------------------------------------

# 3. Responsive Strategy

Breakpoints:

-   Mobile
-   Tablet
-   Laptop
-   Desktop
-   Wide

Mobile-first is mandatory.

------------------------------------------------------------------------

# 4. Dark Mode

Requirements:

-   Every component supports dark mode.
-   Never maintain separate component implementations.
-   Colors come from semantic tokens only.

------------------------------------------------------------------------

# 5. Accessibility

Every interactive component must support:

-   Keyboard navigation
-   Focus ring
-   Visible disabled state
-   Semantic HTML
-   ARIA attributes where appropriate

Color alone must never communicate important information.

------------------------------------------------------------------------

# 6. Component Specification

Every shared component must document:

-   Purpose
-   Props
-   Variants
-   Sizes
-   States
-   Accessibility
-   Usage
-   Do
-   Don't

## Button

Variants:

-   default
-   secondary
-   outline
-   ghost
-   destructive
-   link

Sizes:

-   sm
-   default
-   lg
-   icon

States:

-   default
-   hover
-   active
-   disabled
-   loading

Rules:

-   One primary action per section.
-   Loading buttons remain disabled.
-   Icon-only buttons require an accessible label.

------------------------------------------------------------------------

## Input

Supports:

-   Label
-   Description
-   Placeholder
-   Validation message
-   Disabled
-   Readonly

Never rely on placeholders as labels.

------------------------------------------------------------------------

## Table

Requirements:

-   Responsive
-   Sortable
-   Pagination support
-   Empty state
-   Loading state
-   Error state

------------------------------------------------------------------------

## Dialog

Rules:

-   Trap keyboard focus
-   Close with ESC
-   Restore previous focus
-   Prevent background interaction

------------------------------------------------------------------------

## Toast

Variants:

-   Success
-   Error
-   Warning
-   Info

------------------------------------------------------------------------

# 7. Page States

Every feature should define:

-   Loading
-   Empty
-   Success
-   Error
-   403 Forbidden
-   404 Not Found

------------------------------------------------------------------------

# 8. Interaction Guidelines

Support consistent:

-   Hover
-   Focus
-   Active
-   Disabled
-   Loading
-   Transition

Avoid decorative animations that do not communicate state.

------------------------------------------------------------------------

# 9. Layout Guidelines

Use:

-   Consistent page container
-   12-column grid
-   Shared spacing tokens
-   Predictable section spacing

------------------------------------------------------------------------

# 10. Anti-patterns

Never:

-   Hard-code colors
-   Duplicate components
-   Use inline styles without justification
-   Mix business logic into shared UI
-   Create multiple visual styles for identical actions

------------------------------------------------------------------------

# 11. Review Checklist

-   [ ] Uses semantic color tokens
-   [ ] Supports dark mode
-   [ ] Responsive
-   [ ] Accessible
-   [ ] Reuses shared components
-   [ ] Proper loading/empty/error states
-   [ ] Consistent spacing
-   [ ] Typography hierarchy respected
-   [ ] No duplicated UI patterns

------------------------------------------------------------------------

# Future Expansion

This document will evolve into the complete Olympic UI specification,
including detailed specifications for every shared component, page
template, interaction pattern, motion guideline, and design token.

------------------------------------------------------------------------

# Related Documents

-   frontend-architecture.md
-   frontend-conventions.md
-   state-management.md
-   routing.md
-   api-communication.md
-   ui-surfaces.md


## Contextual Taste foundation pass — 13/10/2026

Reading this as a preserve-brand HUMG university/community redesign: clear academic content and task controls, restrained surfaces, existing typography and palette. Taste v2 brief/audit/cohesion/critique applies; its landing/cinematic defaults do not govern management tables or editors. This section supersedes older gradient/lift examples for shared page headings, Card and Button. No palette/font/dependency replacement is part of this incremental pass.

The existing [page layout owner](../../apps/web/src/components/ui/page-layout.css) defines a72rem general measure,16–32px fluid public gutters,24–34px page titles,20–24px section rhythm and14px panel radius. Rankings uses54rem for scanning; readers and task workspaces retain their own measures. A heading is a clear title/context/action group with a quiet divider, not a promotional panel. Section and Card boundaries use the current border/card/shadow tokens; no default hover lift. Primary/destructive-solid actions use solid semantic fills, outline actions remain outlined, prose links remain links. Mobile Button targets are at least44px; existing focus/loading/disabled behavior stays authoritative.

Honors is a bounded16:9 gallery: status/year, album title, subject, up to three identity/award previews, truthful remaining count and album action form one composition. Rankings uses divided rows with actual rank, avatar/name, approved count and score; it has no invented podium/activity. Full identities remain available through accessible names and the shared profile owner. [Adoption and variants](web-ui.md#shared-foundation-adoption--13102026), [source owners](web-ui-components.md#shared-visual-lookup--13102026) and [evidence/status](../reviews/ux-flow-audit.md#taste-shared-foundations--13102026) hold the implementation details.

Final visual critique: quiet avatar/name/chevron links replace repeated nested identity panels; visible linked names are bounded to two lines while full names remain accessible and in preview/detail. Existing RichTextViewer gains scoped real reading rhythm, as prose-plugin class names alone had no installed implementation. No blanket prose-link Button treatment,card wrapper,animation or editor redesign is introduced.


## Mature HUMG product language — 13/10/2026

This full-app redesign supersedes the earlier preserve-only Taste tuning for common layout and list search. Reading this as a university learning/product interface for learners and staff: restrained HUMG blue, neutral surfaces, compact rhythm, clear academic content and deliberate actions. Taste brief/audit/cohesion applies contextually; task screens use density and readable rows rather than cinematic landing defaults. Existing Be Vietnam Pro/system fallbacks, HUMG primary `#1e40af`, Radix and Tailwind remain. No font substitution. The14/10 ranking refinement adds only @gsap/react beside existing GSAP for scoped interaction motion.

- Page titles22–30px/600 with a quiet divider;20px section rhythm;72rem shared content measure and54rem rankings. Align heading/action edges and use existing responsive gutters. Reader prose keeps its separate measure and scientific notation remains horizontally scrollable where necessary.
- Neutral white/light grey and blue-grey dark surfaces distinguish work from background. Ordinary controls6px, surfaces8px; border/divider does most grouping. Avatars remain circular. Avoid nested framed filters, gradients/gloss/lift or repeated decoration. Native44px controls and explicit focus survive density changes.
- Standalone filters are transparent bands with one bottom divider. Search and discrete controls form one region; visible selection/reset/context and feature-owned busy/error feedback stay near results. Empty search-status rows reserve no space.
- Documents pairs modest3:4 preview space with title/subject/kind, retaining honest missing-thumbnail fallback and its open/download owners. News uses divided editorial rows with small optional images and canonical four type controls, never inferred backend categories. Honors keeps16:9 media with title/subject-year/participant-award/action in one bounded card. Rankings uses aligned rank/identity/score columns, quiet approved-count context and plain supplied rank numbers, including ties. Full ranking names wrap rather than clamp.
- Home becomes a compact resource index and Dashboard uses real role destinations/quick actions; unused demo widget owners stay unmounted. Auth uses a static institution/form split on desktop and one column on phones. FormField keeps its labelled52px field, with6px corners and44px password toggle; remove letter-hop/blur ornament while retaining value/focus/invalid semantics.
- Daily keeps the flat notebook, native lifecycle and800ms serialized sync. Room keeps its persistent scene/player and local media lifecycle. Long editors keep task sections and responsive CreationDialog; shared styling does not merge business, privacy or submission semantics.

[Actual owners/adoption](web-ui-components.md#full-application-owner-and-search-lookup--13102026) and [verification status](../reviews/ux-flow-audit.md#full-app-product-redesign-and-live-list-search--13102026) distinguish source coverage from rendered evidence. This changes presentation and list search only; save/submit/publish/auth/OTP/upload stay explicit.

Dashboard shortcuts are quiet rows for the actual library,News,Daily and profile; the student primary action opens Documents. Existing placeholder practice/history destinations stay in navigation without being promoted as ready actions.


### Ranking composition and purposeful GSAP — 14/10/2026

The latest screenshot audit supersedes the stacked/medal-colored row composition. Within54rem, use three aligned columns: rank, avatar/full name plus approved-count context, score. One divided directory surface replaces individual framed row blocks. Names use14px mobile/15px desktop, weight500; counts use12px with compact visible “N đã duyệt” and a full accessible “N thành tích đã duyệt” label. Score uses17px/600 and tabular numerals. Real ties remain supplied ties. Long identities grow naturally; no ellipsis/fixed height or fabricated podium.

Keep the introduction brief and the labelled native timeframe alongside result context, with inline label/select on narrow screens. The select retains full all-time/year options, URL/page-reset/history semantics and OS behavior. Ranking keyword search is unavailable in the current API; do not imply current-page matching is global search. Supported discovery lists use the shared350ms live-search owner instead.

RankingRow owns GSAP React useGSAP/contextSafe scoped to its identity wrapper. Only the decorative profile chevron translates3px and changes opacity over140ms power2.out on mouse hover or keyboard focus; touch/click uses the real profile Link without waiting. Context/listeners revert on unmount or user-identity change. No mount/refetch/rank-reorder/count tween, invisible entrance or competing modal/floating-control transform. Existing CSS/Radix owns menus and hover-card presence; GSAP never targets those portal positioning wrappers. Reduced-motion preference makes the event transition immediate.

Visual critique rejects huge bold names, isolated score/count stacks, colored podium-like boxes and clipped long names. Full-name rows can be taller for extreme strings; ordinary records stay compact. Synthetic viewport shrink proves layout-viewport geometry only, not physical keyboard/iOS visual-viewport behavior. Exact measurements and before/after proof are recorded with the current [status](../reviews/ux-flow-audit.md#full-app-product-redesign-and-live-list-search--13102026).


## Whole-page composition — 14/10/2026

Current direction: a restrained HUMG learning/product interface with a legible page introduction, a working-control region, and a clear result/task region. This supersedes the default divider under every PageHeader and the equal visual weight of all page regions. Existing type/palette/radii and the accepted compact RankingRow remain; no new dependencies or parallel design system.

Shared owners align public header/page/footer gutters to the same72rem measure. Workspace padding follows the shared gutter; role context uses quiet text instead of repeated uppercase badges. Ordinary section headings use a clear typographic step on the existing surface, rather than a tinted heading band on every panel. Existing44px controls,focus states and responsive header actions remain. No containing-block transform or modal-frame animation is introduced.

Purposeful compositions:

- Documents:14rem desktop facet column beside results, separated with one vertical rule; below1050px controls return above results. Search,subject/kind/tag IDs,active chips/reset and view/pagination URLs retain their responsible owners. Card bylines are quieter; explicit open/download actions remain44px and no longer stretch the open button through unused space.
- News: the current feed occupies the main column; an actual pinned collection occupies a17rem companion column. Below900px the compact pinned notices precede the feed. Pinned headlines/date/type/deadline remain visible; duplicate summaries/read cues are omitted there. The full feed still includes pinned records, with existing query/sort/paging/publication semantics. No pinned section means one full-width feed. Independent pinned errors retain feed access/retry.
- Honors: two compact album columns from1100px, a bounded single column below, and smaller thumbnail/title pairs on phones. Each16:10 cover pairs with title/status/year/subject; participant rows occupy the full card width, followed by a remaining-member/action footer. Titles and member names wrap fully; mobile awards flow below identity instead of taking its name column. Cards grow with actual content rather than forced equal heights. The year selector keeps its associated accessible label while the standalone visible Năm label is omitted. The two public Recognition destinations share a labelled anchor navigation with selected state and retained current URL/hash.
- Home: resource discovery and current News share one desktop working area, stacking below900px. Existing Home search remains explicit navigation. Header links use existing Button-as-Link; empty guidance names the section instead of assuming it is above.
- Dashboard: content/system task groups share one working surface, with discovery/personal destinations beside it; tablet/mobile stack. All destinations derive from current role navigation. No activity/progress/statistics are introduced.
- Reader/profile: News title,body and related links share one52rem outer measure and gutter, with the existing reading/TOC/media owners. Automatic article/title/related entrance effects are removed; the interactive TOC remains. Related items reuse editorial rows. Public profile heading/score weight is restrained and return navigation uses existing controls; eligibility/privacy/revalidation remain unchanged.

Rejected in visual critique: equal-height portrait album columns, a full pinned block before desktop articles, a wide equal-weight strip of library filters, repeated role chips, disconnected reader edges, and a universal card wrapper. Actual task compositions and semantic groups provide hierarchy. New proof/status is in the [existing audit record](../reviews/ux-flow-audit.md#whole-page-layout-composition--14102026); inherited ranking/GSAP proof remains a separate accepted input.

Refinement14/10/2026: News search and four category anchors share44px top/bottom edges on desktop; the redundant padded category frame is removed. Mobile retains a2×2 control grid. Numbered AppPagination already supplies aria-current and page names,so News omits the duplicate page summary; its compact mobile current/total indicator remains. Shared top-menu triggers are icon-only44×44px with their existing accessible name,Radix drawer and focus-return owner. The intentionally labelled desktop workspace side rail remains distinct. [Bounded proof/status](../reviews/ux-flow-audit.md#album-news-and-menu-refinement--14102026).


### News surface and account navigation — 14/10/2026

News keeps compact editorial rows in one neutral card surface with a fine border and modest shared corner radius,not separate elevated boxes. Feed links inset16px on desktop/12px on phones,with14px mobile vertical padding and existing row dividers. Pointer hover uses a4% primary/card mix; keyboard focus uses the accent surface plus an inset2px ring so clipping cannot hide it. No lift/scale or new motion engine. Category labels on this News screen reuse PostBadge with a7% primary/card tint and18% primary border mix. Article bodies remain neutral; pinned cues and semantic deadline/error colors retain their existing owners. Admin badges and other PostBadge consumers are not restyled by the scoped selector.

The approved workspace shortcut now belongs to the existing avatar/account menu's first action: “Không gian quản lý” for ADMIN/LECTURER and “Góc học tập” for STUDENT. The authenticated public header no longer duplicates that shortcut; guest sign-in stays visible. Existing getDashboardRoute and role guards remain authoritative. The avatar retains its accessible menu name,44px target and a title describing account/workspace access; Radix owns open/close,arrows,Enter,Escape and focus return. No duplicate menu item or permission policy is added. See the current [status/evidence](../reviews/ux-flow-audit.md#news-depth-and-account-shortcut--14102026).


### Restrained registry text motion — 14/10/2026

Free React Bits BlurText is adopted only for the Home resource heading and About introduction. Existing HUMG typography/palette/layout remain:2px blur,6px vertical offset,65% initial opacity,280ms resolve and24ms word stagger. Text is present immediately and space is reserved by normal inline layout; there is no page/card entrance sequence. FoldText's3D hinges/large display assumptions were rejected as excessive for a university resource interface. Forms,labels,navigation,rankings and ordinary reading content remain outside this effect.

A real heading/description contains one complete accessible text plus aria-hidden visual words. Reduced motion renders plain static text without the animated copy/observer. The IntersectionObserver disconnects after first entry or unmount; unrelated rerenders do not replay. Installed Framer Motion owns these word transforms; existing GSAP ranking/interactive owners and Radix portal/modal geometry are untouched. No new fonts,dependencies or product semantics. Kokonut FileUpload remains an optional retrieved specimen,not a redesign of existing uploads. See [source owners and proof](web-ui-components.md#registry-components-and-text-motion--14102026).


### Account identity and article-share affordances — 14/10/2026

Kokonut ProfileDropdown contributes the compact grouped-action presentation,adapted to HUMG surfaces/radii,real account identity/role and shared avatar fallback. Long account names use two visible lines and email one,with full accessible text/native titles retained;the single scrolling menu brings focused actions into view on short screens. Quiet icon wells distinguish destinations;the first action remains workspace navigation and the separated destructive row remains logout. No rainbow avatar frame,subscription/model badges,external sample photograph or new account policy. Existing Radix owns positioning,collision,focus,Escape and menu motion.

Kokonut SocialButton contributes a compact article-share trigger which reveals a connected icon strip. The strip reserves its real footprint (at least44px per action,wrapping only when constrained);hidden actions are inert/invisible and the hidden trigger is inert while open. A100ms mouse-intent delay avoids accidental reveal;click/Enter/touch opens immediately and focuses the first action. Short160ms4px action transitions use installed Framer Motion,with static reduced-motion transitions;no page/refetch entrance or competing Radix/modal transform. Labels identify platforms/external navigation,copy/native effects run only on activation. Closed/open state does not resize the article paragraph column.

Carousel assessment rejects hiding the current searchable gallery/feed/library behind horizontal experience cards. A curated Home recognition preview is the closest possible pattern,but requires a separately justified collection/content placement. No carousel adoption or product data fields were added. [Owners/status](web-ui-components.md#kokonut-account-and-article-actions--14102026).


### Resource selection and utility-link feedback — 14/10/2026

Home's resource notebook and Toolkit share a restrained selected-tab treatment adapted from Kokonut SmoothTab:existing type/icons,44px minimum controls,a7% primary/card surface and22% primary/border edge. A measured absolute indicator follows real selection over180ms with no bounce;it also follows wrapped rows and resize. This decorates Radix tabs rather than replacing their focus/keyboard/panel owner. Toolkit composes the shared treatment as two equal columns in a bounded24rem selector;long labels wrap within their column on phones instead of creating an uneven stack. Content renders immediately and remains static through fetch/retry;no fixed sample-card height or panel exit delay. Toolkit's URL/history and GPA local storage remain responsible feature behavior. Reduced motion places the indicator immediately.

Only Home's two real utility links use the free React Bits SpotlightCard cue. A quiet10% HUMG-primary radial accent follows a mouse inside the row;keyboard focus uses a centered cue plus the existing explicit inset outline. Ordinary title/description remain unchanged,readable and clickable without hover. Touch still navigates the standard anchor;reduced motion uses the static accent surface. No independent card borders/shadows or ambient animation engine. Native pointer events/CSS avoid React rerenders,global listeners or persistent frames. The rest of Home's document/announcement list keeps its compact editorial rows.

This is purposeful interaction polish,not another screen template. Subject discovery,News,Honors/rankings,admin/data/forms,readers,Daily,auth and joined-room layouts receive no new decorative effects. Reconsidering the carousel did not reveal a real existing Home album-collection task;no speculative feature or commerce metrics were introduced. Prior BlurText,profile menu,article sharing and shared layout owners remain separate and preserved. See [component/source lookup](web-ui-components.md#resource-tabs-and-utility-link-feedback--14102026).


### Home surface depth — 14/10/2026

Reading this as a HUMG university resource home for learners: calm discovery, a clear working surface and an editorial secondary column. Contextual Taste settings are design variance3 / motion2 / density5; preserve current typography, tokens, copy and routes. This targeted Home treatment supersedes its earlier entirely flat presentation, not the shared task-screen rules.

The search/title area is one bounded static plane:6% primary/card tint fading into card, fine18% primary/border edge, shallow inset highlight and existing surface shadow. Desktop pairs title and search rather than leaving the right side unused;below1024px they stack. The resource notebook is the main elevated card, with a quiet tab band, inset rows and small blue document/utility icon wells. News stays a lighter editorial column with translucent card contrast, dividers and a quiet pointer/focus background;ordinary rows receive no shadows/lift. Existing8px surface/6px control scale remains. No glass, background animation, new media or dependencies.

Home alone places its three SmoothTab controls in equal columns;below400px redundant icons disappear while text labels and44px targets remain. The scoped selector explicitly owns band padding/geometry over the shared SmoothTab defaults;the measured indicator remains aligned. Full resource/news titles wrap naturally. Loading,empty,error/retry and thumbnail fallback remain feature-owned. Existing BlurText,Radix SmoothTab and the two Spotlight utility anchors keep their existing motion/reduced-motion behavior;new News hover is140ms background only under no-preference. No Toolkit/shared primitive restyle. [Owners](web-ui-components.md#home-depth-owners--14102026),[accepted proof and limits](../reviews/ux-flow-audit.md#home-depth-refinement--14102026).


### Loading opacity and truthful readiness — 14/10/2026

Approved FadeContent-inspired loading treatment:keep initial HTML readable;only the logo resolves opacity0.72→1 over180ms. Status/reload remain full-opacity text. The startup overlay fades out over180ms after root interaction is already unlocked;no curtain transforms,minimum display time,completion hold or elapsed-time percentage. A quiet static ink rule is decorative,not a progress measure. Reload is available immediately and short screens scroll within the overlay. Colors use existing HUMG theme tokens with first-paint fallbacks. Reduced motion is fully static and dismisses immediately.

Readiness remains owned by initial tasks/query/font state. Query errors reveal existing feature recovery rather than wait behind unrelated pending assets. Query/guard authorization is unchanged. Route fallback uses scoped useGSAP/matchMedia for the same logo cue;no entrance on normal query refetch. Existing startup code uses imperative gsap.context because its HTML lives outside React. Coalesced readiness events and a StrictMode-safe final-owner cleanup prevent detached tweens,an abandoned inert root or hidden content. No ScrollTrigger,new dependency,loading phase or global animation wrapper. [Owners/proof](web-ui-components.md#loading-opacity-and-lifecycle--14102026).
