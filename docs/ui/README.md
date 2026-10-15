# UI and interaction guide

A restrained HUMG university/community product: readable hierarchy, compact aligned controls, quiet borders/surfaces and purposeful density. Task screens use existing shared tokens and primitives; Home, auth, readers, Daily and persistent room media retain task-specific compositions. Start with the source owner below, then open only the relevant detailed record.

## Find the responsible owner

| Task / interaction | Current source | Detailed lookup |
| --- | --- | --- |
| Page width, gutters, heading/actions, sections and tables | [page-layout.css](../../apps/web/src/components/ui/page-layout.css), [PageHeader](../../apps/web/src/components/ui/page-header.tsx), [PageSection](../../apps/web/src/components/ui/page-section.tsx), [theme](../../apps/web/src/index.css) | [Layout/discovery](owners/layout-and-discovery.md), [design language](../architecture/design-system.md) |
| Public/workspace navigation, account and role destination | [navigation](../../apps/web/src/layouts/navigation.ts), [PublicLayout](../../apps/web/src/layouts/public-layout.tsx), [account menu](../../apps/web/src/features/auth/components/user-dropdown.tsx) | [Home/registry](owners/home-registry-and-motion.md), [navigation decisions](history/home-and-navigation.md) |
| Search/filter query, IME and URL/history | [use-list-search](../../apps/web/src/hooks/use-list-search.ts), [list-navigation](../../apps/web/src/lib/list-navigation.ts), owning feature hooks | [Layout/discovery](owners/layout-and-discovery.md) |
| Dialog / long Create/Edit / dirty confirmation | [Dialog](../../apps/web/src/components/ui/dialog.tsx), [CreationDialog](../../apps/web/src/components/ui/creation-dialog.tsx), [creation CSS](../../apps/web/src/components/ui/creation-dialog.css), [AlertDialog](../../apps/web/src/components/ui/alert-dialog.tsx) | [Dialogs/media](owners/dialogs-and-media.md) |
| Documents phone secondary filters | [DocumentFilters](../../apps/web/src/features/documents/components/document-filters.tsx), [discovery CSS](../../apps/web/src/features/documents/components/document-discovery.css), [Sheet](../../apps/web/src/components/ui/sheet.tsx) | [Filter record](../reviews/history/documents-filters-20261014.md) |
| Protected evidence viewer/download | [EvidenceGallery](../../apps/web/src/components/ui/evidence-gallery.tsx), Daily/Recognition feature adapters | [Dialogs/media](owners/dialogs-and-media.md); adapter owns authorization, identity, refetch/expiry |
| Native Daily / persistent room dialogs | [GroupList](../../apps/web/src/features/daily/groups/group-controls.tsx), [RoomMusicDialog](../../apps/web/src/features/study-room/components/room-music-dialog.tsx) | [Dialogs/media](owners/dialogs-and-media.md); preserve native lifecycle/player continuity |
| Post editor nested image/link chooser | [RichTextEditor](../../apps/web/src/components/ui/rich-text-editor.tsx), [PostForm](../../apps/web/src/features/post/components/post-form.tsx) | [Dialogs/media](owners/dialogs-and-media.md) |
| Avatar/name profile target + hover/focus preview | [UserIdentity](../../apps/web/src/features/user/components/user-hover-card.tsx), [UserAvatar](../../apps/web/src/features/user/components/user-avatar.tsx) | [Identity/Recognition](owners/identity-and-recognition.md), [Recognition privacy](../architecture/recognition.md) |
| Registration six-digit verification | [RegistrationVerification](../../apps/web/src/features/auth/components/registration-verification.tsx), [CodeSlots](../../apps/web/src/components/react-bits/code-slots.tsx) | [Shared controls](owners/shared-controls.md); native input owns values/paste/autofill, feature owns explicit submit/resend/expiry |
| Toast messages, swipe/dismiss/actions and timers | [Toaster adapter](../../apps/web/src/components/ui/sonner.tsx), [SwipeToast](../../apps/web/src/components/react-bits/swipe-toast.tsx) | [Shared controls](owners/shared-controls.md); one Sonner public store, one presentation/lifetime owner; retain CreationDialog Close gutter |
| Recognition album and image-evidence navigation | [HonorGallery](../../apps/web/src/features/recognition/honor-gallery.tsx), [DepthCarousel](../../apps/web/src/components/react-bits/depth-carousel.tsx), [AchievementEvidence](../../apps/web/src/features/recognition/achievement-evidence.tsx) | [Dialogs/media](owners/dialogs-and-media.md); features authorize bytes, PDF evidence has no first-page preview contract |
| Loading/error/empty/retry | [ListFeedback](../../apps/web/src/components/ui/list-feedback.tsx), [EmptyState](../../apps/web/src/components/ui/empty-state.tsx), feature query adapters | [Shared controls](owners/shared-controls.md); retain feature error/retry and busy state |
| Registry provenance, headings, tabs, Home surfaces and preloader | [startup-preloader](../../apps/web/src/app/startup-preloader.ts), [Home](../../apps/web/src/features/home), [registries](../../apps/web/components.json) | [Home/registry/motion](owners/home-registry-and-motion.md) |

## Current interaction rules

- List typing uses the existing debounced search hook where supported; discrete filters apply immediately. Feature owners preserve field-specific matching, page reset, URL/deep links, back/forward, stale-query keys and permissions. `SearchInput` owns input presentation, never business queries. Save/auth/publish/OTP forms remain explicit submissions.
- Below640px Documents keeps search and active chips visible; subject/category/tag use one bottom Sheet. **Xong** dismisses already-applied selections. Secondary reset retains keyword; full reset clears supported filters/page while retaining other parameters. Tablet/desktop facets remain visible.
- Use semantic anchors for destinations and buttons for actions. Give mobile controls44px targets, visible keyboard focus, real pressed/selected/current state and wrapping names/titles. Do not convert informational labels or all prose links into filled buttons.
- Shared frames own geometry/focus; feature adapters own draft/busy dismissal, permission and error state. Preserve inset/zero-translation CreationDialog centering and short/mobile full-height geometry. Do not layer another animation transform over modal positioning.
- Radix owns dropdown/combobox collision, dismissal and keyboard behavior. Existing floating-control motion is concise; native select stays native. GSAP is scoped/cleaned up, with static reduced-motion output; no ranking reorders, fake progress or refetch entrances.
- Profile/achievement public defaults and existing-record visibility follow [Recognition policy](../architecture/recognition.md); public DTOs exclude private account/evidence/reviewer data. Ranking enrollment remains explicit consent. Surface reuse never grants data access.

## Documents card: design decision still open

The card implementation is unchanged. **“Chưa có ảnh” is honest and acceptable.** The issue is oversized/isolated preview reservation and constrained title width, not that wording. A future compact balanced composition should keep title primary, metadata secondary and clear44px actions; integrate missing-preview space without forcing one icon-only solution. Real images retain bounded portrait proportions, containment and safe provenance. Compare image/null/error and long-title states across phone/desktop/dark mode before accepting a card change.

## Evidence and maintenance

[Current status](../reviews/ux-flow-audit.md) is the single work-status entry. [Historical reuse](history/reuse-audit-20261009-10.md) and [adoption](history/component-adoption-20261009-10.md) retain their exact checkpoints/counts; they are not current all-route runtime proof. Older owner guides preserve useful source links and dated observations; current rules here supersede historical manual-search and pending-work language. Old architecture entry paths/anchors remain compatibility links for instructions and bookmarks.

When an owner changes, update this task table and its relevant subject guide. Record implementation acceptance/limits in the existing status, not a second tracker. Do not grow this table into an exhaustive generated source tree.
