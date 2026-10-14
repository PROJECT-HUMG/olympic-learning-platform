# Public profiles and achievement visibility records

> Preserved checkpoint record: `7a70002` (14/10/2026). Dated claims, counts, pending/publication states and temporary evidence paths below describe their original checkpoints; they are not current release or live-proof claims.

## Public profiles and achievement visibility — 10/10/2026

Lead implements and ACCEPTS the integrated local public identity/profile candidate
against `2779b7a257df9f8f0c00edce4c03ee9a51eb6bca`, subject to the exact final manifest
`/tmp/public-profile-final-manifest-20261010.json`. No Peer delegation, staging,
commit, push, deployment, live content/visibility mutation or external setting change.
The policy question is resolved: all existing achievement visibility flags become
public and new submissions default public, while approval gates, evidence privacy,
owner subsequent opt-out and independent ranking opt-in remain. Actual exposure and
one-time V24 deployment/reversal effects: [Recognition policy](../../architecture/recognition.md#duyệt-và-quyền-riêng-tư).

Delivered: `/users/:userId` public page (old `/achievements/:userId` retained), shared
avatar/name Link with initials/image-error/crop handling and Radix pointer/focus
preview. Adopted in public Honors list/detail participants and rankings, document
card/list/detail and News reader (legacy unmounted PostCard also migrated); unlinked historical/unavailable participants
remain honest attribution. `/profile` remains account/security editing with a public
profile link. Public page groups identity and actual public-approved count/points
with existing dated achievement labels/milestones; no invented solved/streak/activity
metrics, public evidence or account/security/admin fields. Minimal public author DTOs
also replace overly broad News/document user payloads and legacy authenticated by-ID
lookup. [Interaction/source quick lookup](../../ui/owners/identity-and-recognition.md#public-identity-and-profile-quick-lookup--10102026).

A reproduced anonymous-session failure cleared even successfully fetched public
Recognition reads. Explicit publicRead metadata now keeps only these minimal public
queries outside the existing expiry clear/cancel rule; private account, Daily, evidence
and admin caches retain that rule. Focused regression covers both retained public
and cleared private observers. Profile query/data revalidation remains authoritative;
stale summaries are suppressed during refetch/error and no private cache seeds it.

Meaningful proof:
- Java25/PostgreSQL16/Testcontainers:32 focused tests passed, including approval,
  visibility/consent/owner/admin/evidence gates; then11 focused tests passed for the
  final legacy identity/API boundary. Final PostgreSQL18/18 passed with V24 expanded
  to old private approved/pending/rejected/revoked rows, retaining reviewer notes,
  statuses and zero ranking enrollment (33 distinct API cases across scoped runs).
  API package passed with tests intentionally skipped after the focused test runs.
- Web Node183/183 passed, TypeScript/Vite env-safe build and Oxlint passed (existing
  Fast Refresh/hook warnings and chunk-size warning). Final verification details and
  hashes are in the manifest; final19 focused presentation/session/identity tests
  also passed. Root/app env files were not loaded/read.
- Actual app routes with intercepted synthetic APIs: `/tmp/public-profile-proof-xNGuhm/results.json`
  has24 settled layout captures (Honors/rankings/profile ×320/390/768/1280 ×light/dark)
  and5 state/keyboard captures,13 checks; `/tmp/public-profile-proof-7LaXr2/results.json`
  adds pointer open/leave, Escape, successful avatar and390px touch interactions,
  9 checks/10 screenshots, no runtime exceptions or private API requests.
- Lead inspected real mobile full-profile/preview and desktop dark screenshots.
  Initial preloader-covered/stale-document captures are rejected evidence, not UI
  proof. One supplemental Chromium startup timed out; the bounded run then completed
  with a longer startup bound. No provider substitution/settings change occurred.

Limits: no production/physical-phone/screen-reader proof or live migration. Evidence
remains private by design, no general public activity feed exists, ranking consent
has not changed. Public profiles are unavailable for pending/disabled/deleted users;
visibility flags on their old achievements still migrate but those records cannot
become publicly readable until eligibility holds. Pending/rejected/revoked claims
remain nonpublic reads and do not score. Original seven-path Daily recovery and
unrelated auth/deploy documentation are preserved; overlapping auth/status additions
are append-only incremental scope with exact preservation hashes/patch accounting.
Owned browser/server cleanup and unstaged index checks belong to the final manifest.


### Avatar delivery investigation — 10/10/2026

Against pushed base `2b94351a8d8900f7afe88471ccebdb29ec0f04c1`: ACCEPT bounded source finding, no demonstrated runtime mapping/field-name omission. Honors/rankings already include avatar URL/crop through batched public identities; Document/News list/detail services enrich the minimal owner/author projection using the existing storage resolver. Public-profile hover fetching is summary-only, not required for row images. No runtime/API/web contract change needed.

Exact payload locations, null/default/unavailable cases and source owners are recorded in the existing [component reference](../../ui/owners/identity-and-recognition.md#avatar-delivery-lookup--verified-against-2b94351-10102026). Fresh offline JDK25 Maven run passed 8/8 (public identity, avatar lifecycle/crop and storage contracts), evidence `/tmp/avatar-delivery-focused-20261010.log`; prior accepted synthetic profile pointer/focus/touch/avatar/retry evidence reused. No live payload/CDN/deployment observation or mutation, no build rerun for docs-only changes, no staging/commit/push. Prior Daily/auth/deploy pending bytes remain intact; this status addition is a separate append.
