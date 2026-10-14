# Public identity, avatar delivery and Recognition owners

> Source lookup reorganized from checkpoint `7a70002`. Dated evidence and adoption counts below remain checkpoint-specific. Start with [current UI guide](../README.md); verify the responsible source before editing.

## Public identity and profile quick lookup — 10/10/2026

| Interaction / screens | Responsible owner and contract |
| --- | --- |
| Avatar + name link, pointer/focus preview: Honors list/detail participants, ranking rows, document card/list/detail, News reader (legacy unmounted PostCard also migrated) | [UserIdentity](../../../apps/web/src/features/user/components/user-hover-card.tsx), existing [Radix HoverCard](../../../apps/web/src/components/ui/hover-card.tsx). Real Link opens `/users/:userId` on Enter/touch; hover is optional. Historical or unavailable Honors identities stay unlinked. |
| Initials, failed image, persisted crop | [UserAvatar](../../../apps/web/src/features/user/components/user-avatar.tsx) → existing [AvatarImage](../../../apps/web/src/features/user/components/avatar-image.tsx); [identity helpers](../../../apps/web/src/features/user/lib/public-identity.ts). Decorative avatar avoids duplicate accessible names. |
| Preview/page data, loading/retry/refetch | [usePublicProfile](../../../apps/web/src/features/user/hooks/use-public-profile.ts) → existing Recognition public service/endpoint, one public-only query key, zero stale time; hide cached summaries during refetch/error. Explicit `publicRead` queries survive anonymous expiry; all private queries keep the [expiry helper](../../../apps/web/src/lib/auth-session.ts) clearing rule. |
| Full public profile and approved dated milestones | [AchievementProfilePage](../../../apps/web/src/features/recognition/public-pages.tsx), existing achievement labels/milestones; [profile styles](../../../apps/web/src/features/user/components/public-profile.css). Identity/sidebar+timeline above900px; stacked on phones. `/profile` remains private account/security editing and links to the public page. |
| Public payload / batch identity / old-record handling | [UserServiceImpl](../../../apps/api/src/main/java/me/nghlong3004/olympic/user/service/impl/UserServiceImpl.java), [RecognitionServiceImpl](../../../apps/api/src/main/java/me/nghlong3004/olympic/recognition/service/impl/RecognitionServiceImpl.java), [visibility policy and V24](../../architecture/recognition.md#duyệt-và-quyền-riêng-tư). Public authors and legacy authenticated by-ID lookup use minimal PublicUserIdentityResponse, never account UserResponse. |

Proof owner: [browser check](../../../apps/web/tests/public-profile-browser-check.mjs),
[public identity tests](../../../apps/web/tests/public-identity.test.ts), existing Recognition
controller/PostgreSQL integration tests. Exact runs/limits are in the existing
[status](../../reviews/history/public-profiles-20261010.md#public-profiles-and-achievement-visibility--10102026).
No fabricated activity/solved/streak totals, evidence galleries or public account fields.

### Avatar delivery lookup — verified against `2b94351`, 10/10/2026

The identity image is already included in the owning response; mounting a list
does not require one public-profile request per avatar. Payload locations:

| Response | Avatar fields | Resolution owner |
| --- | --- | --- |
| Recognition Honors list/detail | `participants[].avatarUrl`, `avatarCrop` | `RecognitionServiceImpl.honorResponse` batches registered participant IDs through `UserService.publicIdentities`; unregistered or unavailable historical identities retain attribution with no avatar/profile link. |
| Recognition rankings | `content[].avatarUrl`, `avatarCrop` | `RecognitionServiceImpl.rankings` batches IDs through the same public identity service; ranking consent and eligibility stay unchanged. |
| Public profile / authenticated legacy user lookup | `avatarUrl`, `avatarCrop` | `RecognitionServiceImpl.profile` / `UserServiceImpl.findById` use the same active, nondeleted public identities. |
| Document list/detail | `owner.avatarUrl`, `owner.avatarCrop` | Existing `DocumentServiceImpl.enrich` uses the storage resolver after `UserMapper.toPublicResponse`. |
| News/Post summary/detail | `author.avatarUrl`, `author.avatarCrop` | Existing `PostServiceImpl.enrichSummary/enrichDetail` use the storage resolver after the same mapper. |

`User.avatar` references the stored File; `UserServiceImpl.updateAvatar` uploads
through `StorageFolder.AVATAR`. All these paths reuse
[`StorageService.getDownloadUri`](../../../apps/api/src/main/java/me/nghlong3004/olympic/storage/service/StorageService.java),
whose current Cloudinary implementation generates HTTPS image delivery URLs
without signing or expiry tokens. This is the existing avatar delivery contract,
not the private Recognition evidence contract. No new raw/private URL generation
or access policy is introduced. `UserMapper` deliberately leaves URL resolution
to services; inspecting its intermediate DTO alone will show null.

No uploaded avatar yields null in batch Recognition identities (initials in
`UserAvatar`); Document/News enrichment retains its configured default image.
Unavailable identities suppress URLs even when a historical avatar exists.
The optional public-profile request starts only when the hover/focus preview
opens, for its approved-achievement summary. `UserIdentity` renders the row's
image directly from its supplied identity, and `UserAvatar` retains initials on
image failure. Frontend/backend both use `avatarUrl` and `avatarCrop`.

No runtime omission was found in this bounded trace. Fresh offline checks:
`PublicIdentityServiceTest`, `UserAvatarServiceTest`, `CloudinaryStorageServiceTest`
passed 8/8; the accepted profile browser evidence already covers successful
cropped images, failed-image initials and preview error/revalidation. These
checks do not establish deployed payloads or live CDN asset availability.


### Public Recognition/News control variants — 11/10/2026

- [UserIdentity](../../../apps/web/src/features/user/components/user-hover-card.tsx) and [profile CSS](../../../apps/web/src/features/user/components/public-profile.css) own the compact avatar/name surface with a decorative chevron, hover/active border/background and visible keyboard focus. Link/preview/touch behavior and supplied URL/crop/initials remain with the same owners; unavailable historical attribution stays unlinked. Recognition styles no longer override identities into blue underlined names.
- [RankingsPage](../../../apps/web/src/features/recognition/public-pages.tsx) uses a bounded60rem public measure and a compact native timeframe field. [RankingList](../../../apps/web/src/features/recognition/ranking-presentation.tsx) / [ranking CSS](../../../apps/web/src/features/recognition/ranking-presentation.css) keep rank beside identity and group approved count/score beneath it. Ties and actual server ranks keep the existing quiet cue; no podium or derived awards.
- Honors uses the same [public page owner](../../../apps/web/src/features/recognition/public-pages.tsx) and [Recognition CSS](../../../apps/web/src/features/recognition/recognition.css): public-only year/subject/submit grid,16:9 media, bounded24rem album cards, participant/award grouping and existing album Button link. [EditorialHonorLabel styles](../../../apps/web/src/features/recognition/achievement-presentation.css) render an informational bordered badge, not an underlined action. Detail navigation uses Button-as-Link; prose links remain prose.
- [PublicNewsFeature](../../../apps/web/src/features/post/components/public-news-feature.tsx) / [News CSS](../../../apps/web/src/features/post/components/public-news-feature.css) own one search/type/reset region. Existing Button-as-Link variants provide selected `default` versus unselected `outline` controls with `aria-current`; narrow screens use two columns and omit the decorative category icon. Keyword context and result count each appear once. Editorial rows keep one semantic reading link and a quiet inset reading cue, without a new nested interactive control or repeated row shadows.

The apparent second “Thông báo” was the selected-summary text, not another category. Canonical IDs remain `ALL`, `ANNOUNCEMENT`, `NEWS`, `BLOG`; no dynamic category source or API taxonomy change was needed. Query submission/page-reset/pinned/sort behavior is unchanged. The [bounded browser regression](../../../apps/web/tests/public-recognition-refinement-browser-check.mjs) covers actual routes with synthetic public APIs and geometric media only; existing [status](../../reviews/ux-flow-audit.md) holds exact final proof and limits.



### Ranking interaction lookup — 14/10/2026

- Screen/timeframe/result state: [RankingsPage](../../../apps/web/src/features/recognition/public-pages.tsx), [YearField/QueryFeedback/Pager](../../../apps/web/src/features/recognition/components.tsx). Compact inline native select, result/busy context, existing retry and page reset; current rankings API has no keyword field.
- Directory columns/full-name density: [RankingList/RankingRow](../../../apps/web/src/features/recognition/ranking-presentation.tsx), [ranking-presentation.css](../../../apps/web/src/features/recognition/ranking-presentation.css). Supersedes stacked count/score, medal fills and two-line ranking clamps. Presentation model preserves supplied rank/ties/order/score/count; no derived standings.
- Identity/avatar/preview/detail: existing [UserIdentity](../../../apps/web/src/features/user/components/user-hover-card.tsx), UserAvatar/public-profile query. No new profile/image fetch or DTO. Ranking CSS locally permits full wrapping; compact identities elsewhere retain their existing bounds.
- GSAP: RankingRow useGSAP scoped ref and contextSafe event callbacks;140ms/3px chevron affordance only. Mouse/focus listeners removed and context reverted on unmount/user change; no data/refetch tween. @gsap/react2.1.2 uses installed gsap3.15.0. Native Select retains OS interaction; [floating-controls.css](../../../apps/web/src/components/ui/floating-controls.css) remains the separate Radix motion owner. Shared Dialog fixed-inset geometry is untouched.
- Proof: existing [product-layout-browser-check.mjs](../../../apps/web/tests/product-layout-browser-check.mjs), PRODUCT_RANKING mode, plus current before/after/geometry/results in `/tmp/humg-ranking-20261014`. No new parallel component system or tracker. Source ledger now covers402 frontend sources and59 route definitions, including ADMIN/LECTURER exam templates; definition coverage is not every alias/role/state rendering.

Home public navigation now remains sticky in normal flow with opaque token background; home-title/nav overlap and text showing through scrolling chrome were reproduced and repaired in public-header.css/public-layout.css. No backdrop/transform owner is introduced around portal dialogs.
