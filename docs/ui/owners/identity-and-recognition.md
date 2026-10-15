# Identity, profiles and Recognition UI

[Recognition policy](../../architecture/recognition.md) owns points/consent/eligibility/evidence; [named features](../../README.md#profile) link actual routes and tests. No public UI may substitute a private account DTO or invent activity/award metrics.

## Individual member profile and own achievements

`/users/:userId` and legacy `/achievements/:userId` share [AchievementProfilePage](../../../apps/web/src/features/recognition/public-pages.tsx). [Individual CSS](../../../apps/web/src/features/recognition/individual-recognition.css) owns a bounded reading column: avatar/full name/username, “Có {n} thành tích”, “Tổng {n} điểm”, then dated “Thành tích và giải thưởng”. Actual allowed records/count and `publicPoints` come from [RecognitionServiceImpl.profile](../../../apps/api/src/main/java/me/nghlong3004/olympic/recognition/service/impl/RecognitionServiceImpl.java); they are neither ranking totals nor number of prizes. `award=NONE` remains “Chỉ tham gia”; [presentation model](../../../apps/web/src/features/recognition/achievement-presentation-model.ts) owns actual labels/breakdowns.

[UserIdentity](../../../apps/web/src/features/user/components/user-hover-card.tsx) keeps a real profile anchor with optional pointer/focus preview; keyboard Enter/touch work without hover. [Profile query](../../../apps/web/src/features/user/hooks/use-public-profile.ts) revalidates and masks cached summaries during refetch/error. [Return helper](../../../apps/web/src/features/user/lib/public-identity.ts) accepts only known same-origin entry paths and preserves query/hash, with deterministic fallback. Historical/unavailable identities remain honest unlinked attribution.

[MyAchievementsPage](../../../apps/web/src/features/recognition/private-pages.tsx) stays student management: actual history first, “Gửi thành tích”, “Xem hồ sơ của tôi”, optional visibility/ranking settings. The public page offers management only to its current student owner. `/profile` is separate private account/security editing. No private evidence, review notes, email or Daily data is added to a public profile.

## Avatar delivery

[UserAvatar](../../../apps/web/src/features/user/components/user-avatar.tsx) / [AvatarImage](../../../apps/web/src/features/user/components/avatar-image.tsx) consume supplied `avatarUrl`/`avatarCrop`; initials handle missing/failed images. The crop/storage contract below applies to every supplied avatar.

Recognition list/detail/rankings batch participant identities through UserService; Documents/News enrich public author projections through their service/mappers. Lists render supplied images without one profile fetch per avatar. Optional profile summary loads only when preview opens. Public image delivery is separate from private evidence access; unavailable identities suppress profile/avatar disclosure as required.

### Avatar crop and storage contract

[UserServiceImpl](../../../apps/api/src/main/java/me/nghlong3004/olympic/user/service/impl/UserServiceImpl.java), [crop request](../../../apps/api/src/main/java/me/nghlong3004/olympic/user/request/UpdateAvatarCropRequest.java), [avatar-crop geometry](../../../apps/web/src/features/user/lib/avatar-crop.ts) and UserAvatar own the contract. `PUT /users/me/avatar` sends the original JPG/PNG/WebP (max5MB) plus optional JSON crop; `PATCH /users/me/avatar/crop` changes metadata only, without storage upload/delete; DELETE clears both. All act only on the current authenticated account.

Finite crop x/y are fractional alignment of overflow (0–1), zoom1–3 above cover, not source pixel coordinates. Use object-position/transform-origin from x/y and scale(zoom); the editor's inverse conversion must reopen the same selected region. Null/missing crop means centered cover/zoom1. V12 adds nullable crop columns and constraints; no old-image recrop/backfill or new cropped asset. Keep the applied migration on rollback. Successful save invalidates current identity/consumer caches; cancel/failure preserves the saved image. [Crop unit](../../../apps/web/tests/avatar-crop.test.ts) and [API integration](../../../apps/api/src/test/java/me/nghlong3004/olympic/user/AvatarCropIntegrationTest.java) checks cover geometry/ownership; cross-origin originals need no canvas download for metadata-only edits.

## Ranking interaction lookup

[RankingsPage](../../../apps/web/src/features/recognition/public-pages.tsx), [RankingList/Row](../../../apps/web/src/features/recognition/ranking-presentation.tsx) and [CSS](../../../apps/web/src/features/recognition/ranking-presentation.css) align rank, full identity, quiet approved count and score in one bounded directory. Preserve server rank/ties/order/count/score and native all-time/year options; no keyword API, podium, derived awards or name clamp.

RankingRow's scoped useGSAP/contextSafe changes only its decorative chevron on hover/focus; touch navigates the semantic Link immediately. Revert listeners/context on unmount/user change; no refetch/rank/count entrance. Radix/floating-control placement and modal centering remain separate motion owners.

## Selecting and submitting Recognition evidence

[AchievementEditor](../../../apps/web/src/features/recognition/achievement-editor.tsx) uses controlled [Kokonut FileUploadSelection](../../../apps/web/src/components/kokonutui/file-upload.tsx). Actual File objects remain in the editor; [validation](../../../apps/web/src/features/recognition/validation.ts) owns MIME/count/size. Invalid additions retain selection. Native chooser keyboard/drop/add/remove, wrapped names and busy/dirty/focus contracts share this path. Selection never invokes the upstream simulated-upload fallback or reports persistence success.

[Recognition service](../../../apps/web/src/features/recognition/service.ts) posts metadata plus evidence parts together. Optional Axios progress measures transferred request bytes; unknown total is indeterminate,100% waits for response. Only confirmed success closes/invalidates. Errors retain text/files for explicit retry; resubmit still requires replacement evidence. Chooser cancellation preserves the draft; in-flight close remains busy-locked, with no new server-abort guarantee. [Private gallery/PDF capabilities](dialogs-and-media.md#recognition-depthcarousel-and-evidence-capability) remain separate from selection.

## Focused checks

[Individual journey/upload](../../../apps/web/tests/individual-recognition-browser-check.mjs), [safe return](../../../apps/web/tests/public-profile-return.test.ts), [public identity](../../../apps/web/tests/public-identity.test.ts), [ranking presentation](../../../apps/web/tests/recognition-ranking-presentation.test.ts) and [media browser check](../../../apps/web/tests/recognition-media-browser-check.mjs) identify current UI proof; API policy/integration tests are linked from the contract. Synthetic browser evidence does not prove live persistence/providers, actual authorization or physical-device/AT behavior.
