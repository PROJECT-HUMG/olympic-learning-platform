# Feature, identity and modal design decisions

> Preserved checkpoint record: `7a70002` (14/10/2026). Dated claims, counts, pending/publication states and temporary evidence paths below describe their original checkpoints; they are not current release or live-proof claims.

## Mobile auth, navigation and private Recognition evidence (09/10/2026)

Password login alone puts the recovery link after the password field and its
inline error at the auth shell's ≤900px breakpoint. Keep the existing 52px
floating fields, 44px recovery/reveal targets, validation associations and login
Turnstile/token lifecycle. Desktop retains its compact above-field recovery link;
other auth forms are unchanged. Mobile navigation (<768px) keeps logo-only public
branding with its accessible home-link name. Both shells use the public-derived
MobileNavbar row: logo left, ThemeToggle → account/login → icon-only menu right (accessible name retained).
Its 64px row has 1rem horizontal padding (12px below360px),8px control gaps,
44px targets, Menu divider and shared focus ring. Workspace page context stays
visible beneath the sticky row, wrapping independently of the controls.
Theme preference/persistence remains with ThemeToggle/useThemeStore in the navbar.
Mobile drawers omit the duplicate theme footer; tablet/desktop behavior remains.

EvidencePreviews/EvidenceViewer share Daily's two-thumbnail/+N and all-items
Dialog presentation, captions, native keyboard activation, close/return focus,
44px controls, short-viewport scrolling and optional 2× image zoom. Feature
adapters own access, freshly authorized metadata, bytes, downloads and operations.
Recognition evidence is private even on a public achievement: owner/admin only,
never mounted by public profiles, hidden during failed/pending revalidation with
abort/revoke on unmount or identity/resource change. Recognition stores API bytes,
not signed URLs; do not introduce external URLs to bypass authorization. Only
validated bounded raster bytes receive image previews; PDF/legacy links retain
honest non-image fallback and feature-owned download/open behavior.

Admin album creation remains Draft by default. The discoverable Công bố album
list action opens the existing editor with explicit publication intent; Lưu và
công bố uses existing validation, upload-before-publication, admin API and
expectedVersion rules. Failures retain fields/saved draft with inline feedback;
conflicts require reopening current metadata for explicit reconciliation. No
new publication/approval/visibility policy, API or media limits are introduced.
See the [component APIs and consumers](component-adoption-20261009-10.md#mobile-and-recognition-evidence-owners-09102026).

Narrow anonymous public navigation also keeps the logo from shrinking into the
theme target: at <360px only horizontal navbar/button padding is compacted,
retaining44px height,8px target separation and complete login label and accessible menu name.


## Visual hierarchy and creation entry flows (10/10/2026, local candidate)

Extend the current academic blue/light and navy/dark palette; do not add a second
brand system. `--surface-border` and `--surface-shadow` in
[index.css](../../../apps/web/src/index.css) give standalone content boundaries a
visible edge and restrained depth. [Card](../../../apps/web/src/components/ui/card.tsx),
PageSection, `.page-table` and `.page-guidance` own panel treatment.
`.content-card` shares this CSS for semantic article/list elements; this is style
reuse, not a universal record component. Card headings have a muted band/divider,
16px mobile/24px desktop padding and wrapping actions. Toolbars inside an existing
panel stay flat; standalone `.filter-panel` bands use 12–16px padding and bounded
wrapping44px controls. Keep sections separated by the existing page rhythm.

Honors is the reference media card: one bounded16:10 image, contiguous16px mobile/
20px desktop body, editorial label/subject/year/title, participant names with
awards, and an explicit44px album action. Album imagery must not dominate the
metadata or become detached from it. Do not nest a retry button inside a link.
At narrow widths, the year occupies one filter row; Search and Tìm share the next.
Documents retain contained file thumbnails; News keeps its editorial image/body
variants. Tables and long readers are not turned into grids of decorative cards.
Home's cinematic hero, auth shell, Daily notebook/calendar and persistent room
scene keep their task-specific structure. Daily explicitly opts out of shared
panel shadow/header fill; its draft, native-dialog and autosync owners are unchanged.

[CreationDialog](../../../apps/web/src/components/ui/creation-dialog.tsx) now owns the
common entity-creation frame. Use a controlled `open`, a useful title/description,
form-derived `dirty`/`busy`, and `children(close)`; Cancel calls that guarded close.
Busy prevents dismissal, dirty asks explicit discard, and success closes directly
through the form's existing callback. It does not validate, persist, upload,
publish, retry or decide permissions. Installed Radix owns focus trapping, Escape,
backdrop and scroll lock. Initial focus is the heading; external triggers regain
focus. Routed new forms specify a return-focus target and retain their URLs,
validated return paths and successful-save handoff to existing edit routes.
This does not add browser-history/unload draft persistence to editors that did not
already have it; explicit modal dismissal is guarded.

The frame is ≤68rem desktop, bounded to viewport height with a reachable header
and internally scrolling body; `.creation-dialog--compact` is ≤36rem for shorter
forms. At≤640px, or at≤1024px with height≤480px, both use the full100dvh viewport with safe-area padding on all sides. Desktop centering uses fixed insets/automatic margins; CreationDialog explicitly replaces inherited percentage translations with zero. Keep only title/Close fixed; full description and form scroll together. Do not constrain
long editors to a tiny overlay, duplicate their page title under the dialog title,
or shrink targets to make them fit. Nested installed choosers retain their own
focus and completion contracts; post image uploads report busy to the owning form.
All default Dialog Close targets are44px. Daily's existing native/custom dialogs
and room-track chooser remain their established modal owners; child option/part/
participant insertion stays within the parent editor, not a second entity-create
flow. See the [complete source/creation coverage ledger](component-adoption-20261009-10.md#visual-and-creation-coverage-10102026)
for actual adoption, exceptions and representative proof limits.

### Broader page-family hierarchy follow-up (10/10/2026)

Use the same surface owners while matching each task's information structure.
News pinned posts use occupied responsive columns: one post fills the band rather
than reserving two empty slots; feed membership, separate priority retries and URL
submission remain unchanged. Rankings uses one `content-card` around the ordered
comparison list with a context band, divided rows and44px profile links, not an
album-card grid. Public milestones group the existing filtered chronology by year
with a muted year band and divided records inside the existing section; this
presentation does not mount private evidence or change scoring.

The document reader and its skeleton share `document-reader__viewport`: desktop
height `clamp(24rem,75svh,60rem)`, mobile≤640px `clamp(14rem,65svh,40rem)`. Keep
reading context reachable on short phones instead of forcing600px. Reader metadata,
preview and description use existing surfaces; edit/download actions stack on
phones so complete labels remain reachable. Profile identity uses its existing
compact two-column arrangement whenever the workspace stacks at≤1099px, preserving
the desktop portrait band. GPA keeps editable rows in one working surface with
row separators and tighter vertical rhythm; calculations/errors/local storage and
Add modal remain feature-owned. Category tabs retain their scrollable Radix strip
with44px triggers and color-only transitions. None of these require new tokens,
per-record decorative nesting, motion or a new framework.

Question Bank uses existing CardHeader/Content/Footer for metadata/status,
question body and wrapping actions; each callback and permission remains local.
Exam drafts and papers share the feature-local ExamListItem presentation: native
44px title link, version/points badges and a separate release/timezone row. Long
unbroken titles shrink/wrap inside the card. Frozen questions, release/solutions
and authenticated figure owners remain unchanged; readers are not list cards.


### Learner document discovery and first-page previews (10/10/2026)

Keep the search-first Documents layout. Ordinary keyword submission still searches
existing title/description data on Enter/Tìm; subject, kind and topic tags retain
existing query parameters and page-reset rules. Use visible field labels, compact
phone subject/kind columns and a full-width tag field; show removable active values
and Xóa tất cả without clearing view or unrelated URL parameters. No invented
sort, topic taxonomy or new metadata. Kind/subject/tags and distinguishing description
belong beside the title, not only inside the reader. The result header's error state
must match list feedback; view switches expose aria-pressed.

[DocumentCard](../../../apps/web/src/features/documents/components/document-card.tsx)
uses a compact portrait preview beside context/title on phones, a bounded portrait
above content on wider screens, and an explicit44px Mở tài liệu action. Two tablet /
three desktop columns keep text readable rather than squeezing five catalogue
columns. [DocumentListItem](../../../apps/web/src/features/documents/components/document-list-item.tsx)
keeps the same subject/kind/tag recognition cues with wrapping titles and a compact
preview. The existing owner-hover, list-return and download-modal contracts remain.
Created-at metadata is labelled Ngày đăng, not last modification.

[DocumentThumbnail](../../../apps/web/src/features/documents/components/document-thumbnail.tsx)
is Document-owned presentation in public cards/list rows and management rows. It
consumes only the server thumbnailUrl, reserves a3:4 frame, contains the whole page
without cover cropping, and displays honest loading/loaded/unavailable states.
Failed/absent previews leave title/context/open actions usable; no PDF original is
fetched to manufacture a browser preview. Compact rows keep fallback copy accessible.
The [storage case reference](component-adoption-20261009-10.md#document-discovery-preview-storage-cases-10102026)
explains actual eligibility and unknown live delivery. No private/signed URL
conversion, account-setting workaround, upload, backfill or migration is added.


### Documents and News: catalogue + editorial discovery (10/10/2026)

Research informed this bounded refinement; it is not a new theme or publication
policy. Public structures inspected10/10/2026:

| Observed reference pattern | Repository task and decision |
| --- | --- |
| [Open Textbook Library catalogue](https://open.umn.edu/opentextbooks/textbooks): search, subject browsing, format filters and linked title/description/read-more records. | Locate material and distinguish similarly titled files. Keep existing subject/kind/tag choices visible; group available description/context with the title and explicit open action, with a bounded portrait page preview. Do not import their license/review/format filters or sorting. |
| [Mathematics catalogue](https://open.umn.edu/opentextbooks/subjects/mathematics): subject context retained while descriptions distinguish linear-algebra/calculus books and editions. | Preserve subject/topic selections and list-return URLs; show actual kind and tags beside similarly named documents instead of relying on filename or image recognition. |
| [MIT News](https://news.mit.edu/) and [education topic listing](https://news.mit.edu/topic/education): news search/browse, linked titles and short context, distinct attention/recent-update sections. | Find school announcements and scan stories. Search/type controls precede existing pinned posts; the chronological feed remains title-led editorial rows with publication date, deadline and summary grouped. Separate priority feedback remains; no new featured scoring, topic/course taxonomy or membership policy. |

The reference inspection is public page-content/structure research, not measured
third-party responsive usability. OCW/OpenStax client-rendered pages and Cambridge
News could not be meaningfully inspected through the reader and were not used as
design evidence. No assets, copy or fonts were imported. Large full-width phone
story images and a universal image-card grid were rejected because they delay title
scanning; copying richer reference taxonomies or a marketing hero would invent
unsupported content. Current blue theme, serif heading and body tokens remain.

News discovery uses its existing `filter-panel`, SearchInput, native type Links and
Button owners. At320px, types deliberately form two columns; larger phones keep a
wrapping row. All choices retain44px targets. The redundant same-page Xem bài viết
header action is removed so discovery becomes reachable sooner. Active type/keyword
and reset remain visible; keyword guidance says **title** because the API matches
only title. Submit still trims on Enter/Tìm; type/search reset page, other parameters
survive those changes, and existing News clear-all reset behavior is retained.
Documents has a different existing reset contract that preserves view/unrelated
parameters; do not harmonize them by styling accident.

The actual News feed remains nine-item pages ordered publishedAt descending,
with pinned membership unchanged. News images are supporting64px squares beside
phone titles,160px16:10 media on wider rows, and absent/failed images yield usable
text rows. Pinned items remain text-led occupied columns. No giant image above
320px titles. Deadlines are separate from summary truncation, with existing urgent/
expired calculations. The reader keeps its ImageLightbox Dialog and reading tools;
body measure is bounded72ch, phone lead/section gaps compact, and the TOC toggle
announces expanded state. Purposeful document portrait previews and editorial
landscape cues stay feature-owned rather than one generic media framework.

See [actual owners and proof boundaries](component-adoption-20261009-10.md#documentsnews-discovery-owners-and-task-evidence-10102026)
and the existing work status for accepted hashes, learner walks and synthetic/live
limits. The42-page broad ledger remains source coverage, not all-screen rendering.


### Admin record-finding and recovery refinements (10/10/2026)

Use compact management toolbars with labeled supported filters and the existing
SearchInput; keep submit/debounce and URL/page semantics with their feature owner.
Phone counters are compact informational context, never an unlabeled substitute
for a status selector. Record titles must disclose distinguishing file suffixes;
POST thumbnails support recognition without dominating the title and use an honest
failed-image fallback. Users use identity/action rows below768px and the existing
relational table at wider widths, with contextual action names and tablet scroll
guidance. This variant serves safe account selection, not a new global card shell.

Destructive confirmations retain the target/error while pending and on failure.
Required option metadata has loading/error/retry feedback separate from the main
record query. Private PDF review restoration validates the URL job identity and
revalidates access before media/actions, while recoverable errors preserve local
corrections. See [actual owners and adoption](component-adoption-20261009-10.md#admin-recovery-and-discovery-owners-10102026)
and [fix disposition/evidence](../../reviews/ux-flow-audit.md#admin-ui-audit-remedies-20261010).


### Mobile modal audit boundary (10/10/2026)

The original [modal owner/variant audit](../owners/dialogs-and-media.md#mobile-modal-frame-audit-8773df0)
against8773df0 remains historical before evidence. Its five issues are repaired
in the scoped mobile-modal UI change (commit/push authorized): Dialog has a shrinking grid column
and fully wrapping context; EvidenceViewer bounds controls and sticks only the
compact title/44px Close, with full record/privacy description scrolling normally;
Recognition downloads show “Tải tệp” with the full filename accessible; native
Daily group buttons are44px and the owner restores prior body overflow on native
close/unmount; the nested POST image chooser has upload-guarded bottom Cancel.
Creation frames retain fixed headers/scrolling bodies; ordinary Dialog scrolls
the whole frame. The subsequent production-geometry repair below makes short phone/tablet landscape fullscreen too.
Find responsible adapters/styles through the [interaction owner lookup](../owners/shared-controls.md#interaction-owner-lookup)
and [repair proof/limits](../owners/dialogs-and-media.md#mobile-modal-repairs-10102026).
Safe-area/physical IME behavior remains bounded by Chromium evidence. Native
room persistence and Daily draft/autosync authority remain distinct.


### Creation frame geometry and floating controls (10/10/2026)

The five-fix commit1a3463d is pushed; deployment bytes were not observed. Physical
phone feedback reopened Post/Document positioning. Production compilation lowered
the mobile `transform:none; translate:none` reset to `transform:translate(0,0)`
and left Dialog’s inherited individual−50% translation active. Synthetic production
Post and Document frames reproduced−160/−284 at320×568 and−195/−140 at390×280,
including with animation disabled; development CSS did not reproduce it.

[CreationDialog](../../../apps/web/src/components/ui/creation-dialog.tsx) now replaces
centering utilities explicitly with zero translations, and its
[CSS](../../../apps/web/src/components/ui/creation-dialog.css) uses fixed insets and
auto margins. This remains stable through minification and animation. Header holds
only title and44px Close; context scrolls with the form. Narrow/short frames use
full100dvh with all safe-area insets; desktop remains bounded and centered.
Post starts with metadata before cover upload, uses one mobile body scroll
(the editor keeps its bounded desktop scroll), and keeps44px toolbar controls.
Document fields have compact mobile gaps and stacked44px actions. Its actual PDF
chooser is a native keyboard button; clear is visible and44px, without changing
upload validation, immediate upload, retry or returned asset-ID semantics.

[Floating controls CSS](../../../apps/web/src/components/ui/floating-controls.css)
owns Radix Select, DropdownMenu/submenu and Popover/Combobox presence:140ms opening,
90ms closing,3px directional travel/.98 scale, correct Radix transform origin;
110ms color/border transitions for triggers/options. Animate content, never the
positioning wrapper or dialog coordinates. Closed content ignores pointers.
Radix owns collision/presence/focus/typeahead; item-aligned Select stays static
and native Select retains the OS popup. No extra GSAP/Framer controller is needed.
Reduced-motion CSS suppresses these effects; no dedicated reduced-motion test.
The account menu now uses this owner instead of a competing navigation animation.

[Proof/status](../../reviews/history/admin-and-modals-20261010.md#creation-frame-geometry-and-floating-controls-20261010)
distinguishes minified production regressions from development-only nested-control
fixtures. Controlled viewport shrink does not establish physical IME, iOS visual
viewport, pinch zoom or notch behavior; it does establish reachable controls when
the layout viewport actually shrinks. No live admin mutations or deployment polling.

## Public identity and profile presentation — 10/10/2026

Identity is a real44px-minimum avatar/name Link. Reuse UserIdentity and UserAvatar
for public attribution; initials and image-error fallback share the existing crop owner.
Radix HoverCard supplements pointer hover and keyboard focus with a compact public
summary; touch/Enter always open the same detail route without requiring the preview.
Use only the public DTO, never login/email/role/admin metadata or private cache seeds.
Preview and full page share a revalidated query and mask old data on denied/error reads.

The profile uses a contained identity/confirmed-public-count-and-score panel beside
an existing dated milestone timeline on desktop, stacking on mobile. This borrows
LeetCode's identity-before-history hierarchy, not its stats, assets or gamification.
Existing colors/type/surfaces stay authoritative. Empty approved-public history is an
honest empty state; no synthetic activity heatmap or inferred participation. Approval,
public visibility, evidence permission and ranking enrollment remain separate gates.
See [owner lookup](../owners/identity-and-recognition.md#public-identity-and-profile-quick-lookup--10102026)
and [actual exposure/migration policy](../../architecture/recognition.md#duyệt-và-quyền-riêng-tư).


### Public Recognition and News refinement — 11/10/2026

Use the existing HUMG light/dark tokens and sans typography. Public profile identities are compact avatar/name links with a quiet bounded surface and chevron, rather than detached blue underlined text. The link remains a Link; optional hover/focus summary and click/touch profile access share one owner. Do not turn ordinary prose links into buttons.

Rankings is a compact record list within a60rem page, with native timeframe selection rather than a full-width mostly empty filter card. Rank, identity, approved count and score form one local group at every width; very long names wrap naturally without truncation or fixed row heights. Honors remains an album grid, with16:9 media and24rem maximum card width, status badge, subject/year, participant/award and album action grouped in one surface. Only its public filter form adopts the deliberate year/subject/action grid; admin editor contracts are unchanged.

News discovery combines labelled search and URL-driven type controls in one region. Navigation uses shared Button-as-Link selected/unselected variants,44px minimum targets and an8px gap. Mobile uses a two-column category grid; the selected category itself supplies the visible state, so its label is not repeated as a second-looking filter. Keyword context, reset and result count remain available. Retain editorial reading rows and restrained borders; avoid a second heading/helper block or repeated elevation for each story. No publication, ranking-consent, approval or filter taxonomy rule changed.

Concrete rejected alternatives: a podium would invent distinction beyond server ranks; stretching a lone album would make its photo dominate sparse results; another tab/underline style would retain the mobile blue-text problem. Responsible owners and proof are linked from the [component reference](../owners/identity-and-recognition.md#public-recognitionnews-control-variants--11102026).

## Visual depth and modern aesthetic refresh — 11/10/2026

Addresses the previous flat, monochrome appearance across public and workspace surfaces. The system replaces flat navy fills and uniform gray borders with rich multi-layer elevation, subtle gradient accents, and responsive micro-interactions:

- **Tokens & Gradients:** Upgraded `--primary` (`#1e40af` to `#3b82f6` gradient) with secondary teal (`#0d9488`), amber (`#d97706`), violet (`#7c3aed`), and rose accents. Added multi-layer shadow system (`--shadow-xs` to `--shadow-2xl`, `--shadow-card-hover`).
- **Core Primitives:**
  - `Button`: Subtle directional gradients, hover brightness and lift, active `scale(0.98)` tactile response, and crisp focus rings.
  - `Card`: Gradient-swept card headers, refined border-radii (`rounded-2xl`), multi-layer resting shadows, and smooth hover transforms (`translateY(-2px)` / `-4px`).
  - `Badge`: Crisp tinted pill variants with subtle borders and enhanced contrast across all semantic states (`success`, `warning`, `info`, `purple`, `gradient`).
  - `Table`: Uppercase tracking header styling, comfortable cell padding, and smooth row hover transitions.
  - `Skeleton`: Custom shimmer gradient sweep animation (`animate-shimmer`), gracefully falling back to pulse under `prefers-reduced-motion`.
  - `ListFeedback` / `EmptyState`: Soft circular radial badge behind icons, modern dashed borders, and clear typographic hierarchy.
- **Surface Modernization:**
  - `Home`: Ambient radial mesh gradient behind hero, glassmorphic search input with multi-layer focus glow, gradient h1 typography, and hover lift on latest news cards.
  - `Documents & Discovery`: Refined document card thumbnails with zoom-on-hover transforms, uppercase subject badges, and clear metadata hierarchy.
  - `Navigation & Shell`: Frosted glass backdrop blur on topbar, gradient indicator on active links and sidebar items, and smooth spring cubic-bezier transitions.
  - `System Categories / Document Tree ("Phân loại tài liệu")`: Modernized administrative category tree management with styled card wrappers, enhanced segmented tab indicators, and clean action button feedback.
- **Accessibility & Dark Mode:** Complete dark mode harmony with tailored dark contrast tokens and automatic suppression of continuous animations when `prefers-reduced-motion` is active.
