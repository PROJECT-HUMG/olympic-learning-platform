# Rà soát luồng sử dụng và điều hướng

Ngày: 01/10/2026. Phạm vi: các màn hiện có, điều hướng theo quyền, tài khoản, kho tài liệu, quản lý bài viết/câu hỏi/người dùng. Không bổ sung hệ thống thi hoặc luyện tập trong đợt này.

Checkpoint trước khi sửa UX: `ecbfb14` — `feat: add study rooms and refresh student UI`. Các thay đổi bên dưới nằm sau checkpoint này.

## Các lỗi đã xử lý

| Luồng | Vấn đề trước đây | Hành vi sau sửa |
| --- | --- | --- |
| Mobile → điều hướng | Toàn bộ sidebar được đẩy xuống đáy, đặc biệt nhiều mục ở tài khoản admin | Bỏ thanh dưới; mở menu trên header, chia nhóm và cuộn riêng trong menu |
| Điều hướng theo quyền | Thiếu quản lý người dùng; chọn sai mục khi vào chi tiết/nhập câu hỏi | Menu chung có học tập, thông tin, cá nhân và nhóm quản lý theo quyền; ưu tiên đường dẫn khớp cụ thể nhất |
| Header tài khoản | Tên dài làm chật header; các nút giao diện/AI bị lặp | Header dùng avatar gọn; một nút đổi giao diện; gỡ trợ lý AI chưa hoạt động |
| Sidebar desktop | Rê chuột tự đổi chiều rộng; khởi tạo từ chiều rộng tự động gây nhảy bố cục | Thu/mở bằng nút; đặt chiều rộng ngay khi render; mục thu gọn có nhãn truy cập và tooltip |
| Menu → đổi trang/kích thước | Trạng thái menu có thể mở lại khi quay về URL cũ | Đóng khi chuyển route, dùng history hoặc đổi breakpoint; hỗ trợ Escape, focus trap và trả focus |
| Trang riêng → đăng nhập | Mất URL đang cần mở | Giữ pathname, query và hash qua đăng nhập, đăng ký, quên mật khẩu và liên kết quay lại |
| Kiểm tra phiên đăng nhập | Mất kết nối dễ bị hiểu thành chưa đăng nhập | Lỗi kết nối có màn thử lại tại URL hiện tại; tài khoản sai quyền về dashboard đúng vai trò |
| Tổng quan | Sinh viên có số liệu/hoạt động mẫu; giảng viên/admin chỉ có placeholder | Tổng quan dẫn tới những chức năng đang dùng được, theo vai trò; bỏ tiến độ và lịch sử giả |
| Trang chủ/footer | Các khối môn học/tài liệu/kỳ thi dùng mẫu; newsletter báo thành công dù không gửi | Trang chủ giữ bàn học và tin tức dùng API; gỡ các khối mẫu, newsletter giả, liên kết `#` và OAuth chưa hoàn chỉnh |
| Tài liệu → tìm/lọc | Debounce ghi đè URL khi Back; xóa tất cả bằng nhiều cập nhật rời rạc | Tìm bằng Enter/nút Tìm; URL giữ bộ lọc; xóa tất cả trong một cập nhật, giữ cách xem |
| Tài liệu → chi tiết → danh sách | Mất từ khóa, bộ lọc, trang và chế độ xem | Giữ URL danh sách; mở trực tiếp chi tiết vẫn có đường về kho tài liệu |
| Tải tài liệu trên mobile | Nút chỉ hiện khi hover và nằm trong liên kết chi tiết | Nút tải luôn hiện khi có hành động, vùng chạm 44px, độc lập với liên kết chi tiết |
| Xem trước tài liệu | Gọi endpoint tải xuống, làm tăng lượt tải chỉ vì mở chi tiết | Dùng `downloadUrl` sẵn có trong response chi tiết; chỉ hành động tải mới gọi endpoint tải xuống |
| Sửa tài liệu | Cache chi tiết dùng slug nhưng bị invalidation bằng ID | Làm mới nhóm query chi tiết và danh sách sau cập nhật |
| Ngân hàng câu hỏi | Chỉ thấy 20 câu; mất tìm kiếm khi quay lại; lỗi mutation có promise rejection | Phân trang thực; tìm kiếm/trang trong URL; quay lại danh sách ổn định; xử lý thành công/thất bại bằng toast |
| Quản lý tài liệu/bài viết | Loading/lỗi trông như danh sách trống; lỗi tải bài viết sửa khiến spinner chạy mãi | Phân biệt loading, empty, error; thử lại danh sách và nội dung chỉnh sửa |
| Bài viết nháp/lưu trữ | Tên bài mở trang công khai dù chưa được công bố | Chỉ bài đang công bố có liên kết công khai; bản nháp/lưu trữ chỉnh sửa trong màn quản lý |
| Người dùng → phân trang | UI nhận page 0 nhưng component phân trang cần page 1 | Chuyển đổi offset tại ranh giới UI/API |
| Người dùng → cấp/thu hồi quyền | Dialog giữ bản chụp người dùng cũ, dễ tiếp tục thao tác với trạng thái cũ | Dialog lấy người dùng theo ID từ query hiện tại; mutation chờ query cập nhật xong; quyền tải lỗi có thử lại |
| Phân trang/bộ lọc trên mobile | Nhiều nút nhỏ và dãy trang dài | Mobile dùng Trước, trang hiện tại/tổng, Sau; bộ lọc có nhãn và vùng chạm phù hợp |
| Luyện tập/lịch sử/kỳ thi | Màn khung dễ khiến người dùng tưởng đã có chức năng | Giữ route nhưng thông báo chưa mở, kèm liên kết đến tài liệu, bảng tin và phòng học |

## Những phần vẫn cần hoàn thiện

### Local commit packaging checkpoint (06/10/2026)

Package the three completed technical increments below together: themed native
scrollbars/custom animated application dialogs, Daily automatic persistence and
matching header controls/shadcn completion. Their shared Daily/test/documentation
paths make one integrated local commit preferable to artificial partial snapshots.
The historical no-commit statements below describe acceptance-time authority;
this checkpoint records subsequent authorization for local packaging only.

All 31 changed/new paths were reviewed against their owning increments; the index
was initially empty. No unrelated/inherited work, environment files, dependencies,
backend changes, build output, browser profiles or screenshots enter this package.
The scoped sensitive-filename/common-secret-pattern check found no suspected secrets;
this is not a claim of exhaustive secret detection.

Current code/test bytes reproduce the final 72-entry polish identity recorded below.
The earlier 80-entry automatic-persistence identity also reproduces when including
its disposable-backend evidence, while later polish changes are accounted for by
the newer manifest. No implementation discrepancy remains. Fresh `pnpm build`
and `pnpm lint` PASS (existing large-chunk and 40 inherited lint warnings), all
**168 Node tests PASS**, and the diff whitespace check is clean. Carry forward
the matching local browser evidence: 32 automatic-persistence/polish, 45 navigation,
41 Daily interaction, 28 scrollbar/dialog and 20 simulated-player checks. Prior
real SQL persistence evidence is retained with its recorded fixture-auth limits;
neither real-backend nor actual YouTube/live-multiuser verification was rerun here.

Technical acceptance does not assert product/design approval or completion of the
original full Daily request. Reflection countdown remains **unimplemented pending
the product target**. Explicit Submit, sharing consent/auth, unsynchronized-draft
protection, independent local room playback and owner-explicit Next remain unchanged.
No push, merge, deployment, spending, installation or external action is authorized.

### Header / Daily Checkbox polish — TECHNICALLY ACCEPTED (06/10/2026)

Bounded outcome: public/workspace header account and theme buttons now have equal
visible 44px circular frames, consistent vertical centers, borders/card backgrounds
and existing action gaps. Avatar images fill the 42px interior; the theme icon is
20px. The earlier mobile render showed a 36px visible avatar inside an otherwise
unframed target beside a 44px theme circle; these are application controls, not
image-viewer or phone chrome. Responsive visibility, menu/account/logout and theme contracts stay
unchanged; the scope-specific styling does not reshape other account controls.

Personal Daily completion now uses the standard shadcn-style Checkbox with the
already-installed `radix-ui` package, a 20px visual box/14px tick and a 44px labelled
touch area. One outline marks keyboard focus around that area. Space and label/click
toggle TODO/COMPLETED; Enter does not submit. Completion still auto-syncs through
the existing debounced versioned editor, stays editable during automatic batches
and is disabled during explicit locked operations. Confirmed deletion hands focus
to the remaining Radix checkbox, not its hidden form input. Read-only/shared views,
explicit Submit, sharing consent, errors/retry and draft guards remain unchanged.
No dependency, API, backend, room playback or ownership contract was changed.

Lead disposition: **ACCEPT this bounded technical candidate** after source review,
actual current render inspection and the results below. Base remains
`d6905eec8071c1507e41dba0de9120c234b4d529`. Candidate identity is the sorted absolute
path union of the four final start/end source manifests below, plus the HTTP
persistence runner's compatibility selector update. Encode as `{base,sources}`:
**72 entries**, SHA256
`65a59f773a40f954d769acc75db76a23bbc40c845501aadf5702eee7581e0458`.
All start/end manifests match; every entry was rechecked against disk after
resumption. The HTTP runner's SHA256 is
`61e33613e3bc0d6f19ad1fdffd4b8244b1c24ef30ba58533662c9ee0da408c3c`.
Documentation is outside that code/test identity. A separate comparison of 74
earlier accepted manifest entries found no unexpected change outside this scope.
Lead is the sole write owner; no new Peer dispatch or inherited-scope reopening
was needed. Existing unstaged Daily/scrollbar/dialog work is preserved.

| Evidence | Actual result / limits |
| --- | --- |
| `pnpm build`, `pnpm lint`, Node suite, diff check | PASS; existing large-chunk build warnings and 40 inherited lint warnings; **168 Node tests PASS**, diff check clean. |
| `/tmp/daily-auto-sync-W6bNE1/results.json` | **32 checks**, zero runtime/native-dialog errors, max one active save. Actual built-preview controls: click/Space/reopen, checked/unchecked, 44px hit area, completion during in-flight edits, explicit-Submit disabled state, delete focus return, batching/retry/conflict/navigation, explicit empty Submit and reflection/week regressions. Header/checkbox bounds measured at 1440×900, 768×1024, 390×844 and 320×568 in both themes, plus 320×360 dark. Uses synthetic versioned APIs, not SQL persistence proof. |
| `/tmp/navigation-after-vMNmzs/results.json` | **45 checks**, zero errors. Mounted guest/public, authenticated public and student/lecturer/admin shells; header dimensions/centers, image and initial avatars, account-menu Escape/focus/logout, tablet/mobile/short drawer, draft guard and OS reduced motion. Synthetic auth/API, not backend authorization proof. |
| `/tmp/daily-ux-ecS0tv/results.json` | **41 checks**, zero errors. Preserved immediate Add, gallery/file-only upload, reflection, dates/history, weekly/group/shared contexts and explicit consent ON/OFF. Current desktop/tablet/mobile/short captures; synthetic APIs. |
| `/tmp/study-player-local-cwhtNX/results.json` | **20 checks**, zero errors. Unchanged mounted player lifecycle, independent local positions/controls and explicit owner Next semantics with simulated players; not actual YouTube or live multiuser proof. |
| HTTP runner compatibility | Completion selector now targets `[role=checkbox]`, not Radix's hidden native input. Syntax check PASS. The disposable real-backend harness was not rerun for this visual-only increment; earlier HTTP persistence evidence is not re-labelled as current primitive/runtime proof. |

Viewed before/after evidence:

- [Before: 36px visible initial avatar versus theme circle](/tmp/daily-auto-sync-rG2zPZ/day-synced-390x844-dark.png)
- [After: equal mobile dark header frames / checked task](/tmp/daily-auto-sync-W6bNE1/polish-390x844-dark.png)
- [Desktop light checked/unchecked and one keyboard outline](/tmp/daily-auto-sync-W6bNE1/checkbox-keyboard-checked-desktop.png)
- [Tablet light alignment](/tmp/daily-auto-sync-W6bNE1/polish-768x1024-light.png)
- [Narrow/short editing remains reachable](/tmp/daily-auto-sync-W6bNE1/short-screen-editing-reachable.png)
- [Explicit Submit disables completion without altering status](/tmp/daily-auto-sync-W6bNE1/checkbox-disabled-during-explicit-submit.png)
- [Image avatar in the same mobile header frame](/tmp/navigation-after-vMNmzs/image-avatar-mobile-dark.png)
- [Authenticated public desktop header](/tmp/navigation-after-vMNmzs/student-public-1440.png)

The current captures are local Chromium renders, not physical-device proof. Final
theme checks use application state/OS preference, not only a manual root class.
Failed/partial runs are not passes: `/tmp/daily-auto-sync-yUvhol` caught a style
measurement during a theme transition and the first render revealed a redundant
checkbox outline; both were corrected. `/tmp/daily-auto-sync-PbJ9l0` reused identical
fixture text across themes, correctly producing no new save, so its error expectation
was invalid. `/tmp/daily-auto-sync-YSuNUC` sent an incomplete CDP Enter event to a
native button; the final runner includes the Enter text event and verifies real
activation. Their partial results do not replace the final frozen run.

Exact increment paths (overlapping earlier unstaged files are not wholly claimed):

- `apps/web/src/components/ui/checkbox.tsx` (new)
- `apps/web/src/components/ui/theme-toggle.tsx`
- `apps/web/src/features/auth/components/user-dropdown.tsx`
- `apps/web/src/layouts/components/public-header.tsx`
- `apps/web/src/layouts/dashboard-layout.tsx`
- `apps/web/src/layouts/navigation.css`
- `apps/web/src/features/daily/components/daily-plan-editor.tsx`
- `apps/web/src/features/daily/ui/study-notebook.css`
- `apps/web/tests/daily-study-ui.test.ts`
- `apps/web/tests/daily-auto-sync-browser-check.mjs`
- `apps/web/tests/daily-persistence-http-browser-check.mjs`
- `apps/web/tests/navigation-browser-check.mjs`
- `docs/architecture/web-ui.md`
- `docs/reviews/ux-flow-audit.md`

Usable handoff: completion is direct and automatically saved; header controls retain
their existing actions with a consistent silhouette. `olympic-context` and
`frontend-design` informed owning-scope isolation and visual restraint. Product/design
approval remains separate. Reflection countdown is still **unimplemented pending
the product target**, not resolved by this polish. No staging/commit, push, deployment,
installation, spending or external action occurred.

### Daily automatic persistence — TECHNICALLY ACCEPTED (06/10/2026)

This decision supersedes the manual day/week/reflection Save criteria in earlier
Daily acceptance records, not their separate Submit/privacy requirements. Manual
Save previously batched full-plan edits and separated versioned persistence from
first submission. Those consistency constraints require serialization/conflict
handling, not a user-operated Save button. Existing APIs already support the new
behavior; no backend, schema, auth, submission deadline or sharing contract changed.

Usable outcome: personal task titles, priority, completion, ordering and day/week
reflection auto-sync after an 800 ms pause. One versioned batch runs at a time;
typing remains available during it. A response with newer local edits acknowledges
only metadata/version; subsequent edits remain dirty and form the next batch.
Add remains an immediate idempotent append, pausing other batches while its dialog
is open. Task deletion remains explicit: a custom destructive confirmation warns
that saving the removal deletes the task and associated evidence records. Evidence
upload/removal, identified group feedback publication and sharing consent/revocation
retain their explicit flows. No automatic Submit occurs. A clean empty day is not
created on entry; explicit empty Submit creates a plan then calls Submit separately.
Reflection on an otherwise empty day also persists normally without submitting it.

Day/week/reflection show pending/saved/error and retry without a manual draft Save.
Invalid intermediate text stays local and resumes after correction. Network or
unknown-result errors retain edits and pause automatic requests until explicit retry.
409 pauses without silently adopting another device's version. A confirmed reload
can replace the draft; cancel retains it. A lost successful response can therefore
require conflict/reload reconciliation, not automatic merging. Date, route and
beforeunload guards remain while dirty/busy/conflicting; blocked route navigation
proceeds once synchronized. Account exits retain the existing exception. No private
drafts are newly stored in localStorage; closing a tab while unsynchronized still
requires the browser-controlled warning and is not durable offline storage.

Rendered iteration: remove the redundant Save button, keep explicit Submit primary,
align reflection sync feedback with the dialog content edge, and use a normal-flow
sync bar below 500px viewport height so an expanded error does not occupy nearly
all editing space under the header. Desktop/tablet/mobile, 320×360, light/dark,
keyboard/dialog focus and OS reduced motion were checked using current renders.
The existing flat task/evidence ribbon and Home selector isolation remain intact.
`olympic-context` and `frontend-design` guided the owning-flow trace and restrained
feedback composition, not a new page redesign.

Lead disposition: **ACCEPT this bounded technical auto-sync increment**, base
`d6905eec8071c1507e41dba0de9120c234b4d529` plus the exact manifests below.
Their sorted, absolute-path source union including `daily-auto-sync.test.ts` has
80 entries; encoded as `{base,sources}` it has SHA256
`bab72ddb84fc0e5823168b0c1a4bfed44ff41cfbc2b1cd477a280e351e9988a6`.
Every start/end manifest was equal and each entry matched disk at acceptance.
The union includes preserved scrollbar/dialog/navigation/player sources to identify
the integrated candidate; those unrelated implementations were not rewritten.
Documentation changes are outside this code/test manifest. No staging/commit,
push, deployment, dependency addition or external coordination occurred.

| Evidence | Actual result and scope |
| --- | --- |
| `pnpm build`, `pnpm lint`, Node suite, diff check | Build PASS (existing large-chunk warnings), lint PASS / 40 inherited warnings, **167 tests PASS**, diff check clean. |
| `/tmp/daily-auto-sync-rG2zPZ/results.json` | **16 checks**, zero runtime/native-dialog errors, maximum one active save. Rapid-edit batching, newer in-flight edits, retry/error/validation/409/lost response, guarded route auto-proceed, confirmed delete/reload, reflection/week reopen, explicit empty Submit; actual mounted production-preview UI with synthetic versioned APIs. |
| `/tmp/daily-ux-IncknW/results.json` | **41 checks**, zero errors: Add pending/failure/retry, Save≠Submit policy (now auto-sync≠Submit), gallery/upload/file/legacy focus, date/history, day/week/group/shared contexts and consent ON/OFF. Desktop 1440/1024, tablet 768, 390/320 mobile, short 320×360. Synthetic APIs. |
| `/tmp/daily-ux-f2alw5/results.json` | **44 checks**, zero errors: direct versus same-document Home→Daily, populated/empty day/groups, invitations and Home keyboard/appearance. 1440×900 and 390×844 light/dark, 768×1024 and 320×360 light. Synthetic APIs on local Vite. |
| `/tmp/daily-http-s0pl3o/results.json` | **5 groups**, zero errors: immediate Add; automatic title/reflection/priority/completion persistence and full-document reopen; weekly auto-sync/reopen; original private bytes, gallery/upload and unrelated-account 403. Production Daily/evidence services, Flyway V1–V23 and disposable PostgreSQL; fixture identities/login adaptation, not production cookie/token/provider proof. |
| `/tmp/scroll-dialog-FtEtOG/results.json` | **28 checks**, zero errors; preserved themed native scrolling and custom editor/destructive-dialog behavior. Synthetic APIs. |
| `/tmp/navigation-after-dwLF56/results.json` | **32 checks**, zero errors; preserved public/authenticated/role-specific responsive shell and genuinely unsynchronized Daily navigation guard. Synthetic auth/API. |
| `/tmp/study-player-local-Y6VToY/results.json` | **20 checks**, zero errors; unchanged independent local player lifecycle/control behavior. Simulated players, not actual YouTube or live multiuser proof. |

Current viewed screenshots include
[reflection and aligned sync footer](/tmp/daily-auto-sync-rG2zPZ/reflection-desktop.png),
[short-screen retained editing](/tmp/daily-auto-sync-rG2zPZ/short-screen-editing-reachable.png),
[mobile dark synchronized state](/tmp/daily-auto-sync-rG2zPZ/day-synced-390x844-dark.png),
[tablet weekly reflection](/tmp/daily-auto-sync-rG2zPZ/week-tablet.png),
[task/evidence ribbon](/tmp/daily-ux-IncknW/task-ribbon-desktop-variants.png) and
[Home→Daily empty desktop](/tmp/daily-ux-f2alw5/aligned-spa-empty-day-1440x900-light.png).
These are current generated local renders, not physical-device screenshots.

Ownership / exact increment paths (Lead owns all writes):

- `apps/web/src/features/daily/components/{daily-plan-editor,daily-week-editor}.tsx`
- `apps/web/src/features/daily/hooks/use-daily-auto-sync.ts` (new)
- `apps/web/src/features/daily/lib/{daily-lifecycle,plan-editor}.ts`
- `apps/web/src/features/daily/ui/{daily-sync-status.tsx,study-date-picker.tsx,study-notebook.css,use-daily-confirm.tsx}` (`daily-sync-status.tsx` new)
- `apps/web/tests/{daily-auto-sync.test.ts,daily-auto-sync-browser-check.mjs}` (new)
- `apps/web/tests/{daily-study-ui.test.ts,daily-wire.test.ts,daily-ux-browser-check.mjs,daily-persistence-http-browser-check.mjs,navigation-browser-check.mjs}`
- `apps/web/README.md`, `docs/architecture/web-ui.md`, this existing audit.

The bounded read-only Peer response was **REJECTED as evidence**: it repeated the
review questions without causal findings/line-level support and quoted an altered
hook hash while claiming a match. The disposition was sent, its scope closed and
no dependent candidate accepted from it. Lead independently inspected the sources,
revision/rebase tests, rendered results and actual HTTP persistence evidence.

Failed/partial runs remain separate: `/tmp/daily-auto-sync-NHqB4f` had an incomplete
API fixture missing required counts; `/tmp/daily-auto-sync-qqhB55` used a synthetic
click that did not open the Radix menu (fixed to keyboard interaction).
`/tmp/daily-ux-DA4i2Z` caught the obsolete date-guard copy, now corrected.
The first HTTP rerun hit an unhandled cancelled CDP interception, now handled;
the initial Java invocation lacked the configured JAVA_HOME and was retried with
the installed JDK. `/tmp/navigation-after-WJFMMb` encountered a missing preview
document during rebuild; rerun on the stable build passed. `/tmp/daily-auto-sync-XJlPZl`
terminated with exit 143 without a final result; it is not acceptance evidence.
`/tmp/daily-ux-Tif9zW` was a malformed viewport environment argument, not a product
failure; the corrected matrix passed. Earlier successful runs before the final
short-screen/footer style correction do not replace the final manifests above.

Limits: no production/live-account auth, real multiuser concurrency, physical
phone/keyboard, Safari/WebKit or offline durable-draft recovery proof. Version
conflicts are intentionally not auto-merged. Older manual-Save HTTP runners are
historical and not current acceptance criteria (see README). **The reflection
countdown target remains undecided and unimplemented**, owned by the product owner;
resume that separate criterion when a target is chosen. This increment is accepted
technically, not product/design approval or completion of that outstanding scope.

### Native scrollbar/dialog increment — TECHNICALLY ACCEPTED (06/10/2026)

Base `d6905eec8071c1507e41dba0de9120c234b4d529`, initially clean worktree.
Lead owns all current writes: global scrollbar/motion styling, shared shadcn
Dialog/AlertDialog, mounted post-editor link entry, focused tests and existing docs.
No API, room player, Daily persistence or countdown contract changes. No new commit
or external effect is part of this increment.

Delegation disposition: the bounded editor writer's claimed candidate was rejected
because no patch existed and its hash/consumer/check claims contradicted disk. The
separate read-only inventory and its follow-up were rejected as inadequate and
internally inconsistent evidence. Both scopes are explicitly closed and relinquished;
Lead implemented the actual patch and verifies actual source/rendered artifacts.
Neither report is used as acceptance evidence.

Lead source trace: routes `/admin/posts` and `/lecturer/posts` mount
PostManagementPage → PostManagementFeature → PostForm → RichTextEditor/MenuBar.
The only browser-native question call was its link URL prompt. Daily's `confirm`
identifiers resolve to useDailyConfirm/AlertDialog, not window.confirm. Other management
confirmations already use custom primitives; room close confirmation is inline.
Room Music and group creation use styled HTML dialogs with their own DOM controls,
not browser-generated question boxes. Retain native Daily beforeunload (tab close/reload
cannot be safely replaced), OS file chooser and browser permission/security UI.
Question data named `prompt` and ARIA `role=alert` are not native prompt calls.

Current implemented behavior: platform-native scrollbars use existing theme tokens,
with no wheel/touch interception or added dependency; forced-colors defers to the UA.
Post link insertion captures selected text/range, uses the existing Tiptap URI safety
policy, isolates portal form submission from PostForm, and cancels without mutation.
Shared modal animation is 150ms with explicit reduced-motion precedence; alerts have
short/narrow viewport bounds and scrollable content. Alert action/cancel class merging
is corrected so existing destructive colors/control overrides actually apply.

Lead disposition: **ACCEPT** the actual bounded application/test candidate. The four
current browser manifests were independently rehashed against disk with no mismatches.
Their sorted 70-entry union, serialized as `{base,sources}` with base above, has SHA256
`5c2f6ee783f4cd8d45dc1be9f8a6550acce43af5982bf4faaedcceb968eb5f82`.
Documentation is status metadata outside that application/test snapshot. Product/design
approval is separate; no stage/commit/push/deployment was performed.

Exact changed paths for this increment (all Lead-owned, no inherited changes):
`apps/web/src/index.css`, `apps/web/src/components/ui/dialog.tsx`,
`apps/web/src/components/ui/alert-dialog.tsx`, `apps/web/src/components/ui/rich-text-editor.tsx`,
`apps/web/tests/native-prompts.test.ts`, `apps/web/tests/scroll-dialog-browser-check.mjs`,
`apps/web/tests/daily-ux-browser-check.mjs`, `apps/web/tests/navigation-browser-check.mjs`,
`apps/web/README.md`, `docs/architecture/web-ui.md`, `docs/reviews/ux-flow-audit.md`.

| Verification | Actual result / evidence |
| --- | --- |
| Mounted increment, production preview on loopback 3001, synthetic APIs | `/tmp/scroll-dialog-fmYiXc/results.json`: **28 checks, zero errors/native question dialogs**, stable 9-entry manifest, SHA256 of `JSON.stringify(candidateEnd)` `ffa2933d07230cd9b15e972c67b88edeeb1aaa6c6f95770409cb100d6b253952`. 1440×900/768×1024 light, 390×844 dark, 320×360 light: selected text retained, URI validation, Enter insertion without parent post submission, cancel/Escape/focus trap/return, destructive styling and explicit DELETE only, open/closing presence, actual reduced-motion suppression, forced-colors defaults, wheel/keyboard and emulated touch scrolling, short public drawer. |
| Daily dialog/gallery regression, production preview, synthetic APIs | `/tmp/daily-ux-GN9aHm/results.json`: **41 checks, zero errors**, stable/current 41-entry manifest, SHA256 `4a0d6e69c54b48db7e3d2ad7201a82ef0a4f8ac955c1142214d6d49f6e5d58c7`. Add pending/failure/retry and unrelated drafts; Save≠Submit, upload/gallery/files/legacy evidence, reflection drafts/save context, reload confirmation, date/busy/draft safety, group sharing/revocation/audience and read-only evidence. This focused `interactions` scope excludes the unchanged Home route-history/empty-state matrix, not a new acceptance of every earlier Daily requirement. |
| Shared-shell regression, production preview, synthetic auth | `/tmp/navigation-after-vwibZz/results.json`: **32 checks, zero errors**, stable/current 20-entry manifest including global CSS. Public and student/lecturer/admin shells, desktop/tablet/mobile/short/dark, role visibility, drawer/account/focus/draft blocker and breakpoint edges. |
| Player regression, simulated YouTube API | `/tmp/study-player-local-zyFmL8/results.json`: **20 checks, zero errors**, current player manifest. No room/player/session application bytes changed. Not actual YouTube or live multiuser proof. |
| Local web checks | `/tmp/scroll-final-build.log`: TypeScript/Vite PASS, retained >500kB chunk and plugin timing warnings. `/tmp/scroll-accepted-lint.log`: PASS, zero errors/40 inherited warnings. `/tmp/scroll-final-node.log`: **164 Node tests PASS**, including a type-resolved whole-src native-call inventory and a fixture proving alias/indexed/destructured globals are detected without flagging local confirm. `git diff --check` PASS. |

Lead inspected current full-size screenshots, not merely overflow assertions:
[desktop link dialog](/tmp/scroll-dialog-fmYiXc/link-1440x900-light.png),
[tablet](/tmp/scroll-dialog-fmYiXc/link-768x1024-light.png),
[dark phone](/tmp/scroll-dialog-fmYiXc/link-390x844-dark.png),
[short phone](/tmp/scroll-dialog-fmYiXc/link-320x360-light.png),
[short destructive confirmation](/tmp/scroll-dialog-fmYiXc/confirmation-320x360-light.png),
[public drawer scroller](/tmp/scroll-dialog-fmYiXc/public-drawer-320x360.png),
[short gallery controls](/tmp/daily-ux-GN9aHm/gallery-controls-320x360-light.png),
[dark reflection scroller](/tmp/daily-ux-GN9aHm/reflection-desktop-dark.png),
[Daily reload confirmation](/tmp/daily-ux-GN9aHm/custom-reload-confirmation.png).
Dialogs remain bounded and controls reachable by native scrolling at short heights.

Failed/incomplete runs remain excluded: `/tmp/scroll-dialog-4pPbIr` omitted Enter's
text event; `/tmp/scroll-dialog-BtvYEH` selected the outer PostForm's Cancel instead of
the nested link Cancel. `/tmp/scroll-dialog-jsZtDs` found the real reduced-motion
precedence defect, corrected in global styling. `/tmp/scroll-dialog-89obCB` lacked
synthetic CORS preflight headers; `/tmp/scroll-dialog-k8GRxp` encountered a document
reload during dev/build activity. `/tmp/navigation-after-AdolFW` failed an immediate
resize assertion; the final runner waits for layout/React handoff and passes with the
same application bytes. No passing results are inferred from those failures.
`/tmp/daily-ux-AJpoCo` and `/tmp/daily-ux-kJ6kOX` ended without a completed result;
partial screenshots are not acceptance proof. Final focused Daily evidence is the
completed stable production-preview run above. Browser helpers now include shared
CSS/primitives in their snapshots and offer `interactions` mode without dev-only
query imports; their default full Daily matrix remains available.

Usable path: mounted staff post editor → select text → link toolbar → input → explicit
Insert, or Cancel/Escape. Scrolling surfaces retain native physics and accessibility;
no scroll library, dependency or new backend contract. Existing styled HTML room/group
dialogs remain application-owned custom UI. The only retained browser-native app
warning is Daily tab unload for unsaved drafts; OS file/security/permission UI is
intentionally not replaceable. Whole-src type-aware/source inventory finds no native
alert/confirm/prompt call; dynamic runtime code/browser extensions are outside that
inventory. Safari/WebKit/Firefox/physical-device scrollbar and touch behavior are not
rendered here; older-engine CSS is source-based, and overlay-scrollbar visibility is
still controlled by OS/browser preferences. Synthetic auth/API is not backend privacy,
persistence or authorization proof. Reflection countdown is still separately pending
the product target; this increment does not resolve it or restore a visible motion toggle.

### Daily task/dialog increment — TECHNICALLY ACCEPTED; countdown PENDING (06/10/2026)

Lead owns the integrated Daily/backend candidate and existing unfinished alignment correction. Local commit `86e827f` contains completed room/navigation work; Daily implementation, Home selector isolation and Daily-only dashboard-title hunk were excluded. Retained room/player/navigation manifests match disk; a fresh web build/lint and 14 targeted Node checks passed before that commit. No unrelated staged changes existed.

Current direction: owner-only versioned/idempotent task append persists one task without submitting or replacing unrelated local/saved edits; file-only upload in a shadcn dialog with neutral stage and backward-compatible legacy records; authorized private image previews and all-items gallery; reflection dialog with existing questions and task context. Existing Home/Daily isolation and empty/group alignment criteria are technically accepted with the fresh same-document evidence below, superseding the earlier unfinished checkpoint. The reflection countdown target is undecided: current code defines only a 07:30 first-submission cutoff, not a reflection boundary. Product owner must choose an optional reminder time or explicitly a time-remaining-in-day indicator; no deadline or lock is inferred.

Reopened task/evidence presentation: the previous desktop layout reserved `minmax(240px, 38%)` for evidence while title/priority/menu occupied separate left-side rows. This produced a disconnected horizontal gap, roughly 313px evidence-bearing rows and 134px evidence-free rows. The integrated revision instead uses one completion/title/priority/menu/upload header and associated evidence cards immediately below. Title measure is bounded at 52ch; previews align with the title's content edge on desktop, with deliberate action wrapping and full-width evidence grouping on narrow screens. Two preview photos, a truthful document/legacy-link card and all-items access remain. Current measured desktop rows are 189px with evidence and 69px without, with matching title/preview x=348px at 1440px. Read-only shared tasks use the same stacked association, not an auto-column split.

`olympic-context`, `frontend-design` and existing project visual guidance informed this task-led grouping: retain platform palette/type, use task dividers instead of redundant enclosing cards, keep attachment previews meaningful and bounded, and reserve dialogs for upload/gallery/reflection rather than primary task controls. Reflection keeps existing questions with keyboard-scrollable task context, side-by-side at desktop/tablet and stacked on mobile; short-mobile context is bounded at 88px, with a sticky Close header and scrollable question/save content. This is visual reimplementation, not a new data model.

The append/privacy read-only Peer response is **ACCEPTED as bounded supporting source-inspection evidence only**. Lead inspected its actual response and verified the cited append/version/locking/retry, local draft rebase and private-byte lifecycle scope. It did not run runtime tests and does not prove concurrency, production auth, visual quality or full candidate acceptance; later presentation bytes supersede its frozen editor/evidence snapshot. The disposition was sent and acknowledged; scope CLOSED, no writer/review owner remains. Lead owns every moving write scope and integration.

Lead disposition: **ACCEPT the bounded integrated technical increment**, base `86e827ff3439c0410d0d838ea86ccf32fd70af49` plus the exact frozen application/test manifests below. The rejected rigid split is not accepted. Fresh desktop/tablet/mobile renders demonstrate associated task/evidence grouping, flat aligned Daily entry after Home, compact empty/group states and usable dialogs without changing persistence/privacy/draft semantics. This permits the authorized second scoped local commit, not release or product/design approval. **The complete requested scope is not achieved: reflection countdown remains pending the product owner's target decision.** Return to that criterion when the target is explicitly chosen; do not repurpose submission timing.

| Verification | Result and exact evidence |
| --- | --- |
| Current mounted UI, synthetic auth/API | `/tmp/daily-ux-03nzx2/results.json`: **106 checks, zero errors**, matching 39-entry start/end manifest, independently rehashed against disk with zero mismatches. SHA256 of `JSON.stringify(candidateEnd)`: `a530e6e48d368c71ccdb9688a4bb31188c595a4f674e305f97f67f5be18ca9b5`. Includes Add pending/failure/retry, Save≠Submit, upload failure/retry, two-image/+N/all-items/file/legacy gallery, opener focus/Escape and scrolled short-screen controls, reflection drafts, custom confirmation, today/explicit/invalid date and dirty/busy safety, truthful history, group sharing ON/OFF/audience retention and read-only review, direct and actual mounted-link Home→Daily empty/populated composition. |
| Additional focused composition | `/tmp/daily-ux-TGC85a/results.json`: **37 checks, zero errors**, identical application bytes; only the subsequently improved browser runner differs. Supplements 491px/tablet/dark/short same-document and invitation states. Not an exact final runner snapshot. |
| Actual local HTTP/SQL persistence | `/tmp/daily-http-nliJfZ/results.json`: **4 groups, zero errors**, production Daily/evidence services with disposable PostgreSQL. Immediate task Add without Save/Submit, preservation of unrelated drafts, reflection Save/full reload, neutral and retained legacy evidence, actual multipart upload/reopen, original private bytes/no-store and unrelated-account denial. Its 16-entry manifest is stable; only notebook CSS differs from final disk (later short-reflection presentation). All functional entries match. Not final visual proof or production cookie/token/provider authentication proof; fixture login adapts refresh requests. Harness finished normally, `/tmp/daily-final-http-harness.log` BUILD SUCCESS. |
| Backend tests | `/tmp/daily-final-api.log`: **64 tests, zero failures/errors/skips**, disposable PostgreSQL, Daily/calendar/mapping/evidence/group access/sharing. Owning backend bytes retained from the verified functional candidate. |
| Shared-shell regression | `/tmp/navigation-after-mCEcXL/results.json`: **32 checks, zero errors**, stable 19-entry manifest, all entries still match disk. Synthetic public/authenticated and role-specific workspace navigation, tablet/mobile/short/dark/account/focus/draft blocker; not real-backend authorization proof. |
| Required web checks | `/tmp/daily-accepted-build.log`: TypeScript/Vite PASS; retained >500kB chunk warning. `/tmp/daily-accepted-lint.log`: PASS, zero errors/40 inherited warnings. `/tmp/daily-verified-node.log`: **162 tests PASS**, zero failures/skips. `git diff --check` PASS. |

Lead inspected full-size current screenshots, not the image-viewer framing of a desktop capture. UI matrix: 1440x900, 1024x900, 768x1024, 491x850, 390x844, 320x568 and 320x360; relevant light/dark, gallery/upload/error/reflection and empty/populated/group/shared/week states. The isolated Home notebook retains its 1px border/14px radius and keyboard tabs before/after Daily styles load; Daily root has 0px border/radius/padding on direct and same-document entry, with header/status/task/nav edges aligned. Invitation pending/loading/error/retry/accept/decline stay direct and do not enable sharing. Empty-plan Save and separate Submit remain usable without zero/N/A metrics.

Current screenshot comparisons (ephemeral local evidence):

- [Rejected desktop split](/tmp/daily-ux-3nVSiw/day-gallery-desktop-light.png) → [unified header and evidence variants](/tmp/daily-ux-03nzx2/task-ribbon-desktop-variants.png), [1024px grouping](/tmp/daily-ux-03nzx2/task-ribbon-1024x900-light.png), [768px grouping](/tmp/daily-ux-03nzx2/task-ribbon-768x1024-light.png), [390px](/tmp/daily-ux-03nzx2/task-ribbon-390x844-light.png), [320px](/tmp/daily-ux-03nzx2/task-ribbon-320x568-light.png).
- [Earlier leaked Home frame](/tmp/daily-ux-OhNNor/home-to-empty-day-1440.png) → [flat Home→Daily empty day](/tmp/daily-ux-03nzx2/aligned-spa-empty-day-1440x900-light.png). [Earlier sparse framed groups](/tmp/daily-ux-OhNNor/home-to-empty-groups-491.png) → [compact 491px groups](/tmp/daily-ux-03nzx2/aligned-spa-empty-groups-491x850-light.png), [dark groups](/tmp/daily-ux-03nzx2/aligned-spa-empty-groups-390x844-dark.png), [Home retained](/tmp/daily-ux-03nzx2/home-notebook-1440x900-light.png).
- [Desktop reflection](/tmp/daily-ux-03nzx2/reflection-1440x900-light.png), [tablet reflection](/tmp/daily-ux-03nzx2/reflection-768x1024-light.png), [short reflection](/tmp/daily-ux-03nzx2/reflection-320x360-light.png), [dark reflection](/tmp/daily-ux-03nzx2/reflection-desktop-dark.png), [short gallery controls](/tmp/daily-ux-03nzx2/gallery-controls-320x360-light.png), [read-only shared evidence](/tmp/daily-ux-03nzx2/shared-evidence-768.png).

Failed runs remain excluded from final acceptance: `/tmp/daily-ux-flAmOC` failed because the test toggled an already-selected audience member on the second viewport; `/tmp/daily-ux-wghBi2` completed 95 checks then timed out on a drawer during route transition (driver readiness accepted the previous document's shell); `/tmp/daily-ux-ej7NHS` failed a test-only top-level variable redeclaration in newly added scrolled-gallery capture. The runner now waits for a new-document identity and committed SPA effects, uses scoped evaluation variables and selects the audience deterministically. Earlier route/query/Enter-driver failures and stale-layout evidence are not converted into passes; no application regression is inferred solely from a capture/driver failure. Final manifest includes the corrected runner.

Limits/downstream use: `/daily` → today or explicit date → immediate Add → direct draft controls → upload/gallery/reflection dialogs → explicit Save/Submit. API must include the append endpoint and **new V23** before this web contract is used; V19/V22 and legacy bytes/records are untouched. Screenshot evidence uses local Chromium and synthetic responses with external assets blocked; no physical-device/Safari/WebKit, production login, remote storage or exhaustive concurrent-browser proof is claimed. Short screens scroll rather than fitting every control above the fold. The dev-only query launcher is visible in development captures and can overlap bottom content. Room/player/independent positions/owner-explicit Next and shared navigation production bytes remain as the first commit. No external action occurred. Product/design approval and the reflection countdown decision remain open.

Exact task-owned paths for this Daily commit (no unrelated staged changes at reconciliation):

```text
apps/api/README.md
apps/api/src/main/java/me/nghlong3004/olympic/daily/controller/DailyController.java
apps/api/src/main/java/me/nghlong3004/olympic/daily/evidence/controller/EvidenceController.java
apps/api/src/main/java/me/nghlong3004/olympic/daily/evidence/enums/EvidenceStage.java
apps/api/src/main/java/me/nghlong3004/olympic/daily/evidence/service/impl/EvidenceServiceImpl.java
apps/api/src/main/java/me/nghlong3004/olympic/daily/repository/DailyPlanRepository.java
apps/api/src/main/java/me/nghlong3004/olympic/daily/request/AddDailyTaskRequest.java
apps/api/src/main/java/me/nghlong3004/olympic/daily/service/DailyService.java
apps/api/src/main/java/me/nghlong3004/olympic/daily/service/impl/DailyServiceImpl.java
apps/api/src/main/resources/db/migration/V23__neutral_daily_evidence.sql
apps/api/src/test/java/me/nghlong3004/olympic/daily/DailyIntegrationTest.java
apps/api/src/test/java/me/nghlong3004/olympic/daily/evidence/EvidenceControllerTest.java
apps/api/src/test/java/me/nghlong3004/olympic/daily/evidence/EvidenceIntegrationTest.java
apps/web/README.md
apps/web/src/features/daily/components/daily-plan-editor.tsx
apps/web/src/features/daily/components/daily-week-editor.tsx
apps/web/src/features/daily/evidence/evidence-contract.ts
apps/web/src/features/daily/evidence/evidence-panel.tsx
apps/web/src/features/daily/evidence/evidence-preview.ts
apps/web/src/features/daily/groups/feedback-panel.tsx
apps/web/src/features/daily/groups/group-avatar.tsx
apps/web/src/features/daily/groups/group-controls.tsx
apps/web/src/features/daily/groups/groups.css
apps/web/src/features/daily/hooks/use-daily-editor.ts
apps/web/src/features/daily/hooks/use-daily.ts
apps/web/src/features/daily/lib/calendar-presentation.ts
apps/web/src/features/daily/lib/daily-contract.ts
apps/web/src/features/daily/lib/date-selection.ts
apps/web/src/features/daily/lib/plan-editor.ts
apps/web/src/features/daily/services/daily.service.ts
apps/web/src/features/daily/ui/daily-dialog-header.tsx
apps/web/src/features/daily/ui/study-calendar.tsx
apps/web/src/features/daily/ui/study-date-picker.tsx
apps/web/src/features/daily/ui/study-notebook.css
apps/web/src/features/daily/ui/study-notebook.tsx
apps/web/src/features/daily/ui/study-section.ts
apps/web/src/features/daily/ui/use-daily-confirm.tsx
apps/web/src/features/home/components/home-hero-section.css
apps/web/src/features/home/components/home-study-notebook.tsx
apps/web/src/layouts/dashboard-layout.tsx
apps/web/src/pages/daily-groups-page.tsx
apps/web/src/pages/daily-owner-page.tsx
apps/web/src/pages/daily-shared-review-page.tsx
apps/web/src/pages/daily-week-page.tsx
apps/web/tests/daily-alignment.test.ts
apps/web/tests/daily-calendar-presentation.test.ts
apps/web/tests/daily-immediate.test.ts
apps/web/tests/daily-persistence-http-browser-check.mjs
apps/web/tests/daily-study-ui.test.ts
apps/web/tests/daily-ux-browser-check.mjs
apps/web/tests/daily-wire.test.ts
apps/web/tests/navigation-browser-check.mjs
docs/architecture/web-ui.md
docs/reviews/ux-flow-audit.md
```

Bounded backend Peer returned no candidate, claiming an instruction conflict and absent files. Lead **REJECTS that blocker**: target files exist and preserving existing hunks under exclusive ownership is consistent with project rules. Backend diff remained the original 26 lines. Assignment closed, no Peer write ownership remains; Lead takes the implementation scope. No downstream work depends on that response.

### Listening-first room / visual rework — IN VERIFICATION (06/10/2026)

Lead owns the bounded frontend hierarchy/player/renderer integration at base
`618882653dd6ae5ed3cb382d985e9c7a5f497d82`. No backend/API, dependencies, shared
timeline, gameplay, seating reservation, saved customization or external actions.
Preserve deliberate Join/activation, one persistent player, independent device audio
and positions, owner-explicit Next/no-ended-advance, request policy and one outstanding
track per account (including owner), privacy/auth and focus accounting. Reflection
countdown remains unrelated and undecided. Product/design approval stays open.

Direction from frontend-design/project guidance: selected track/local controls lead,
quiet Queue/People companion, compact rhythm; original rounded stone/oak observatory
with an orbital window, clearer seated scholars and paired daylight/evening lighting.
The bounded renderer report is **REJECTED**: no file diff/artifact was applied, so its
claimed implementation/checks cannot be evidence. Scope is closed; Lead owns writes.
The subsequent read-only lifecycle/permission report is also **REJECTED**: it supplied
the 40-character HEAD as file SHA256 values, omitted requested scopes and inferred
defects from controlled mounting/state updates. Actual source uses `open`-controlled
dialogs, first-visit player mounting, conditional membership cleanup and slot-keyed
furniture updates, not unconditional renderer rebuilds. No code changes are based on
that report; the response loop is closed and Lead independently verifies the candidate.

Early actual renders revealed missing walls/window rings from mixed indexed and
non-indexed batch geometry. Lead corrected normalization; passing early screenshots
are iteration evidence only, not final acceptance. Mobile review also identified an
over-tall listening block, redundant action row and a wrapped 320px volume control;
compact toolbar, deliberate three-control mobile row, edge-bounded local-volume
popover and paired Next summary are being verified. Lead also added explicit opener
focus return for external Add/settings/closure controls. Preserve failed harness/build
results separately from eventual acceptance. Final matching source manifests, rendered
matrix, interaction checks and required web checks must be recorded before disposition.

### Three.js study room — TECHNICALLY ACCEPTED (06/10/2026)

Lead owns the renderer, scene/session/player integration, local evidence and technical disposition; no Peer owns a moving write scope. Replace the existing presentation-only scene with an original fantasy observatory, retaining existing membership/presence, timer/accounting, identity-derived looks and participant details. No shared seat claiming, saved customization, group association, gestures/events or backend changes. Music opens a focus-safe dialog with a single persistent player; selection remains room-owned, playback device-local and Next explicitly joined-owner-only. Acceptance requires current 3D and fallback renders, desktop/tablet/narrow/short layouts, music open/close stability and recovery, participant keyboard access, reduced motion, cleanup/hidden rendering bounds, existing behavior checks and required build/lint. Synthetic evidence is not live media/multiuser proof; product/design approval remains open.

Lead disposition: **ACCEPT the scoped local technical candidate**, HEAD `312ce365202266f353c77289a1f93ea46be34264` plus the frozen application manifests below. The actual Three.js scene, accessible participant controls, aligned responsive composition and persistent Music dialog work with the existing room contracts. This is an original low-poly fantasy observatory, not a guarantee of AAA production quality. Technical acceptance is not product/design approval or release authority.

`olympic-context`, `frontend-design` and the project visual guidance informed the direction: spend visual character on the timber/stone/rug/mountain room and seated scholars; keep the surrounding platform tokens and controls quiet. Existing identity-derived presets remain, with real account fields in DOM details. Desktop has a 320px timer rail sharing scene top/bottom edges; tablet uses a two-column timer band before the scene, mobile is timer-first. Now-playing distinguishes room selection from local playback. No membership, accounting or backend contract was changed.

Exact task-owned changed/new paths (relative to the task-entry dirty tree, not all changes against HEAD):

```text
apps/web/package.json
apps/web/pnpm-lock.yaml
apps/web/README.md
apps/web/src/features/study-room/lib/room-world.ts
apps/web/src/features/study-room/lib/room-world-layout.ts
apps/web/src/features/study-room/components/study-room-scene.tsx
apps/web/src/features/study-room/components/study-room-scene.css
apps/web/src/features/study-room/components/study-music-player.tsx
apps/web/src/features/study-room/components/room-music-dialog.tsx
apps/web/src/features/study-room/components/study-room-session.tsx
apps/web/src/features/study-room/components/study-room.css
apps/web/tests/study-playback-selection.test.ts
apps/web/tests/study-room-world.test.ts
apps/web/tests/study-room-ux-browser-check.mjs
docs/architecture/study-rooms.md
docs/architecture/web-ui.md
docs/reviews/ux-flow-audit.md
```

Three.js and its development typings are the only direct dependency additions. Previously dirty player CSS, lobby, Daily, navigation and API implementation bytes are preserved. No staging/commit or external release action occurred.

Current rendered evidence, using mounted routes in local Chromium with actual Three.js/SwiftShader and synthetic auth/API/YouTube; external traffic is blocked:

| Completed run | Evidence | Result |
| --- | --- | --- |
| Desktop/tablet layout | `/tmp/study-room-after-wVjGmM/results.json` | 7 check groups; 1440x900, 1024x900, 768x1024, light/dark scene, modal/volume/persistence/focus |
| Tablet/mobile/short layout | `/tmp/study-room-after-CCoH2b/results.json` | 9 groups; 800x600, 390x844, 320x568, 320x360, long-title player error/loading/retry |
| Member/owner interactions and lifecycle | `/tmp/study-room-after-hGLfO9/results.json` | 21 groups; actual TV/character picking, delayed renderer loading, polling stability, local pause/volume, requests, offline/reconnect, Leave, explicit versioned Next/no-ended-advance, all nonowner roles, moderation/closure, empty/error/retry, 50-member pagination, reduced motion/offscreen/context loss/fallback |
| Discovery/create/preview | `/tmp/study-room-after-Pd83cj/results.json` | 7 groups; guest/authenticated at 1440/768/320, create focus/cancel-retained draft, preview without implicit join/player |
| Final explicit desktop fallback and dark Music | `/tmp/study-room-after-IdWK0P/results.json` | 6 groups; motion/visibility/context lifecycle, 1440px fallback light/dark and dark modal, 320x360 fallback |

Every completed run has matching start/end bytes and zero recorded runtime/interception errors. All five runs share the same 21 application/dependency/contract entries, excluding the separately versioned browser runner: SHA256 of the ordered JSON manifest is `814278c28a88722e78f788b5cd06492b527cf9b2c6d2a6e5f1adc4edc627037f`. Those entries were independently rehashed against disk. The first four have full 22-entry digest `70b94cf113ec60bfd624f501e97be8946381ee0d16c77f67d18a27bbb43db6cf`. The last run includes the corrected explicit desktop fallback capture and has full digest `6397575eaf7d4392aa983afbb1b8a4082ba5c2494a2991cbfc98301995dd63c6`; final runner hash is `8daaa417977324b676d259b1d6a6f2dc0c7d06903861436095e06247a3d6d53b`. Earlier files named `webgl-unavailable-desktop` were actually 390px; they are not desktop proof.

Lead inspected current screenshots for composition, readable controls/identity, wrapping, alignment, theme, loading/error/empty and fallback, not merely overflow. Desktop timer/scene measured the same 655.94px height and matching top/bottom edges; timer band heights are approximately 329px at 768px, 312px at 800px and 314px at 1024px. Main header/timer targets remain 44px. Short viewports scroll normally; the dialog keeps Close accessible, not every control above the fold.

Screenshot comparisons and handoff (ephemeral local files):

- Earlier 2D desktop baseline: [before](/tmp/study-room-after-jxcfpD/corrected-owner-1440x900.png). Current [full owner view](/tmp/study-room-after-wVjGmM/owner-1440x900.png), [aligned 3D composition](/tmp/study-room-after-wVjGmM/scene-1440x900.png), [dark scene](/tmp/study-room-after-wVjGmM/scene-dark-1440x900.png).
- Current [tablet timer/scene](/tmp/study-room-after-wVjGmM/owner-768x1024.png), [800x600 timer band](/tmp/study-room-after-CCoH2b/owner-800x600.png), [320px scene](/tmp/study-room-after-CCoH2b/scene-320x568.png), [320x360 dialog](/tmp/study-room-after-CCoH2b/music-320x360.png).
- Current [participant details](/tmp/study-room-after-hGLfO9/member-details-desktop.png), [TV-opened Music](/tmp/study-room-after-hGLfO9/in-room-tv-dialog.png), [owner Next](/tmp/study-room-after-hGLfO9/owner-explicit-next.png), [long-title error](/tmp/study-room-after-hGLfO9/long-track-error-320.png), [scene loading](/tmp/study-room-after-hGLfO9/scene-loading.png), [empty room](/tmp/study-room-after-hGLfO9/empty-room-scene.png).
- Current [1440px fallback](/tmp/study-room-after-IdWK0P/webgl-unavailable-desktop.png), [dark Music](/tmp/study-room-after-IdWK0P/music-dark-desktop.png), [short fallback](/tmp/study-room-after-IdWK0P/webgl-unavailable-320x360.png), [320px discovery](/tmp/study-room-after-Pd83cj/lobby-320.png).

Additional verification: final `pnpm build` passed (`/tmp/room3d-final-build.log`); lint passed with zero errors and 40 inherited warnings; 158 Node tests passed (`/tmp/room3d-final-node.log`); diff check is clean. Player `/tmp/study-player-local-lx70oH/results.json` passed 20 deterministic checks, including two distinct local positions, independent controls and no-ended-advance; its hashes match disk. Existing navigation `/tmp/navigation-after-mJe75r/results.json` has 32 passes and every retained manifest entry still matches disk; this is retained regression evidence, not a fresh navigation redesign. Task-entry fingerprints show only the 17 paths above changed/added; Daily/API/navigation bytes are unchanged by this room increment.

Failed/incomplete evidence remains separate: `/tmp/study-room-after-fvQZID` counted one on-demand redraw as continuous reduced-motion animation; `/tmp/study-room-after-Jy9E9Q` and `/tmp/study-room-after-cW6Wsv` exposed stale motion diagnostics despite the emulated preference being reduced. Scheduling now checks the preference directly, resets pose and separately counts animation frames. `/tmp/study-room-after-6lvhyD` failed a strict Tab-loop assertion; explicit parent-control boundary wrapping corrected it. `/tmp/study-room-after-1KaryP` terminated with exit 143, cause unestablished; `/tmp/study-room-after-yQdXnP` timed out capturing a tablet screenshot. Smaller sequential runs completed the same application matrix. Earlier moving-candidate/preview-termination/browser-stall runs `kcKVCy`, `4u15cn`, `9Pm5n3` are not final proof. No application root cause is claimed for host/browser termination or capture stalls.

The bounded independent read-only source report is **accepted as limited source-inspection input**, not candidate/visual approval. Its original frozen scene/dialog/motion bytes are partly superseded by the later corrections; Lead inspected and accepted the integrated artifact. The scope is closed and no further Peer work is pending. Previously rejected assessment reports remain excluded.

Performance/resource limits: lazy room chunk is approximately 547.07kB minified / 137.89kB gzip and retains the >500kB build warning. Material batching reduced the recorded four-character draw calls from about 553 to 157–158 including shadows. Rendering is capped at 24fps/DPR1.5, one 1024px shadow map, and stops when hidden/offscreen/obscured/reduced-motion/stale; state/resize can redraw on demand. Actual context loss, retry and unmount cleanup were exercised. Document-hidden/pagehide checks use deterministic events; they are not physical-tab/BFCache/device tests. No physical GPU FPS, battery/thermal, Safari/device or smooth actual YouTube/audio proof is claimed. Hidden/cross-origin YouTube behavior and real live multiuser/backend authorization remain unverified. Existing backend guards/contracts were preserved, not replaced by fixtures.

Usable downstream path: discovery → explicit room preview/join → shared timer/3D characters and accessible details → header/TV/now-playing Music dialog → independent local controls and authorized explicit Next. Open/close does not recreate the iframe; absent WebGL retains participants/timer/music and retry. No saved appearance, authoritative seat choice, free roaming, shared gestures or Daily-group integration was added. Product/design evaluation can now use the current screenshots; no deployment is authorized.

At the room checkpoint, the Daily alignment correction below was deferred, **unfinished and unaccepted**. Its then-latest focused browser run `/tmp/daily-ux-ynEwwE` passed direct empty desktop composition checks but timed out entering Home. Room success did not close Daily acceptance; the resumed Daily section above owns the subsequent implementation/evidence/disposition.

### Daily alignment and route-style isolation — TECHNICALLY ACCEPTED above (06/10/2026)

Lead owns this bounded correction; no Peer is dispatched. The previous Daily technical acceptance did not establish consistent cross-route composition: populated direct-entry captures omitted empty tasks/groups and Home → Daily stylesheet persistence. Fresh reconciliation at `/tmp/daily-ux-OhNNor` reproduced a 1px/14px outer frame after Home while direct entry had no frame, using the same Daily source bytes. The owning Home stylesheet and Daily reused the global `.study-notebook` class. Prior claims of consistently resolved alignment are superseded by this finding; functional checks remain evidence only for their tested paths. Product/design approval remains open.

Direction: give Home its own `.home-study-notebook` root without changing its notebook values; keep Daily as a flat page canvas with aligned header/work/reflection edges, not compensating root padding. Local area links show Cá nhân/Nhóm with preserved full accessible names/routes; only Daily routes use generic Góc học tập shell context so the primary title is not repeated in the topbar. Empty tasks omit zero/N/A progress but retain direct Add, reflection, empty-plan Save and separate Submit. Group invitation states become direct: pending/loading/error before the group list, quiet empty status after it; accept/decline and explicit consent remain unchanged. Existing tokens, motion, role guards, date/deep-link selection and draft behavior remain.

Acceptance requires direct and same-document Home → Daily renders for empty/populated day/group screens at desktop/tablet/mobile/short widths and relevant light/dark modes, computed alignment and identity checks rather than overflow alone, Home appearance/keyboard and unrelated shell regression checks, empty Save/Submit and invitation state/action checks, existing Daily behavior plus required local web verification. The expanded Daily browser manifest includes Home/shared-shell/base styles; synthetic API/auth evidence is not real-backend proof. This alignment correction does not itself reopen backend/dependency/study-room scope; the separate immediate-task/neutral-evidence increment above owns its necessary API/V23 changes. Scoped local Daily staging/commit is authorized after bounded technical acceptance, preserving the earlier room/navigation commit; no push, merge, deployment, remote installation or external effects.

### Scoped study-room visual corrections — TECHNICALLY ACCEPTED (05/10/2026)

Lead owns the four rendered findings and their bounded implementation; no Peer is dispatched and no shared-shell/Daily/backend scope is reopened. Preserve independent device positions, owner-explicit versioned Next, existing lifecycle/retry/membership guards, room accounting/controls, keyboard access and OS reduced motion. No new dependencies or external/release actions. The prior inspection identified a blank 200px failed-player frame, tablet row-track gaps, orphaned/unequal 320px action rows and a 4px range-input center offset; its screenshots are `/tmp/study-room-inspection-IWlRYm` and the matching earlier `/tmp/study-room-after-qMTgFL`.

Implementation direction: keep the player mount node but hide its already-destroyed frame only on error, group status and recovery controls, keep valid active/loading iframe dimensions, split timer reading/configuration and guidance/controls into independent tablet columns with accounting spanning both, size narrow header/timer actions as deliberate equal-width rows, and isolate the range input from normal form-field spacing. Existing palette/type/shell are unchanged. Acceptance requires fresh rendered long-title failure/retry at 320x568; timer grouping at 768x1024, 800x600 and 1024x900; actions at 320x568/320x360; centered volume across widths; surrounding light/dark/member/owner/discovery states; normal web checks and continued no-seek/no-ended-advance behavior. Synthetic player/API evidence is not real YouTube/backend/live multiuser proof.

Lead disposition: **ACCEPT the exact scoped local technical candidate**, HEAD `312ce365202266f353c77289a1f93ea46be34264` plus the matching frozen source/test manifests below. The four rendered defects are corrected without reopening the room design or changing playback/mutation logic. Technical acceptance is not Human product/design approval or release authority. No Peer was dispatched; Lead retained sole write ownership. `olympic-context`, `frontend-design` and the project visual guidance informed task grouping, local selector specificity and screenshot-led refinement, not a new palette or broad redesign.

- Mounted rooms: `/tmp/study-room-after-jxcfpD/results.json`, **47 checks**, zero recorded runtime/interception errors, 17 manifest entries. SHA256 of `JSON.stringify(candidateEnd)`: `b5547ecd6af144b6459b7ec69bb1b44cb4e69f366b28be395cb3d681b15c3eec`.
- Player: `/tmp/study-player-local-4vGEgM/results.json`, **20 checks**, zero errors, 7 manifest entries including player CSS. Manifest digest: `b2ca61fb73b7b8501e4e0029f101cd2c358f13cf6cce48b38efd327c80598b5a`.
- Both start/end manifests match and every entry was independently rehashed against disk. Preserved navigation `/tmp/navigation-after-4sig7e` and Daily `/tmp/daily-ux-8i6B6g` manifests have zero mismatches; all inherited Daily/API paths remain unchanged. The 65-entry task-start fingerprint shows changes only in the six scoped already-dirty paths; the seventh task path, player CSS, became newly modified. No staged paths.

Observed corrected outcomes in fresh local Chromium renders:

1. **Failed player:** at 320x568 with a long title, the destroyed frame occupies zero height (previously 200px). The message and keyboard-operable Retry remain together above the fold in the music-focused view. Retry restores the loading frame to at least 200px before readiness; active frames remain at least 200px in both dimensions. The mount node/lifecycle are retained, not replaced by a different player architecture.
2. **Tablet timer:** reading/progress/configuration form one column; guidance/actions/bell note form the other, with matched top edges and independent internal spacing. Accounting remains full-width underneath. Progress-to-configuration gap is 12px at all seven measured viewports, instead of inheriting a tall unrelated grid row. Timer heights are approximately 329px at 768x1024, 312px at 800x600 and 314px at 1024x900. At 800x600, the prior approximately 381px panel is now approximately 312px. Short screens still scroll normally; this is not a promise that the entire room fits above the fold.
3. **320px actions:** Invite/Music have equal 140px columns and Leave occupies the following full-width row. Owner timer actions have equal 119px columns and 44px heights; “Chỉnh giờ” and “Bật chuông” remain single-line. The optional third bell-test action retains its full-row rule; its enabled state was not separately screenshot-validated in this increment. All controls and labels remain present, and the keyboard/focus behavior is unchanged.
4. **Volume:** locally resetting the range input's inherited form margins/padding centers its label, slider and percentage. Measured center offset is about 0.008px (previously 4px) across 1440/1024/768/800/390/320 widths; the input retains a 44px touch-height.

Before/after evidence (local, ephemeral `/tmp` files):

| Finding | Before | Current |
| --- | --- | --- |
| Long-title player error, 320x568 | [Blank failed frame](/tmp/study-room-inspection-IWlRYm/player-error-320.png) | [Compact error and Retry](/tmp/study-room-after-jxcfpD/corrected-player-error-320x568.png), [loading after Retry](/tmp/study-room-after-jxcfpD/corrected-player-loading-320x568.png) |
| Tablet timer, 800x600 | [Uneven row spacing](/tmp/study-room-inspection-IWlRYm/owner-800x600.png) | [Grouped timer](/tmp/study-room-after-jxcfpD/corrected-timer-800x600.png) |
| Narrow room header, 320x360 | [Orphaned Leave action](/tmp/study-room-inspection-IWlRYm/owner-320x360.png) | [Deliberate header rows](/tmp/study-room-after-jxcfpD/corrected-owner-320x360.png), [owner timer actions](/tmp/study-room-after-jxcfpD/corrected-timer-actions-320x360.png) |
| Volume, tablet | [Offset range input](/tmp/study-room-inspection-IWlRYm/owner-music-768x1024.png) | [Aligned volume](/tmp/study-room-after-jxcfpD/corrected-music-768x1024.png) |

Lead also inspected current 768x1024/1024x900 timers, 1440px owner/timer/music, narrow player/loading/music, 320px dark member, 1024px dark member, desktop/mobile discovery and mobile Join preview. Seven geometry checks cover 1440x900, 1024x900, 768x1024, 800x600, 390x844, 320x568 and 320x360 with no horizontal overflow, aligned volume and valid player sizes. Full checks retain loading/error/empty/reconnect, owner/nonowner controls, dialogs/focus, room lifecycle and OS reduced motion. Screenshots are scrolled to the relevant task region when indicated, not necessarily page-top captures; the dev-only query launcher remains visible and can overlap bottom content.

Verification: final `pnpm build` PASS (TypeScript + Vite, existing >500 kB chunk warning); `pnpm lint` PASS (existing warnings, zero errors); `node --test --test-isolation=none tests/*.test.ts` **150/150 PASS**, zero failed/skipped; focused selection tests **5/5 PASS**; `git diff --check` PASS. Player fixtures still retain distinct positions with zero app-issued seeks; mounted local owner/nonowner ENDED changes no shared selection, while explicit owner Next emits the existing versioned request. These are deterministic frontend checks, not backend enforcement proof.

Failed/interrupted checks remain separate: `/tmp/study-room-after-AeXXMi` passed compact-error and geometry checks but timed out during keyboard Retry because the runner omitted Enter text/focus emulation. The runner was corrected to dispatch a real Enter event; application keyboard/freshness guards were not relaxed. Screenshot review also caught a wrapped “Bật chuông” label; local internal button spacing was refined without shrinking targets. Focused `/tmp/study-room-after-CKKD6b` passed all eight layout checks before the final full pass. A final build process returned exit 143 despite emitting bundle output; it was not counted as successful. A clean rerun exited 0.

Exact paths changed in this increment:

- `apps/web/src/features/study-room/components/study-music-player.tsx`
- `apps/web/src/features/study-room/components/study-music-player.css`
- `apps/web/src/features/study-room/components/study-room-session.tsx`
- `apps/web/src/features/study-room/components/study-room.css`
- `apps/web/tests/study-room-ux-browser-check.mjs`
- `apps/web/tests/study-player-browser-check.mjs`
- `docs/reviews/ux-flow-audit.md`

Usable downstream: open `/toolkit?tool=rooms` and `/study-rooms/:roomId` with the matching existing local API, or reproduce synthetic renders with the existing room/player runners. `ROOM_CHECK_SCOPE=layout` optionally runs only the eight targeted layout checks; the default remains the full suite. No outstanding product decision is needed for these corrections. Actual YouTube playback/buffering, real backend authorization/accounting/persistence, live multiuser operation, physical touch devices, WebKit and screen-reader/zoom behavior remain unverified. External assets are blocked in browser evidence; fake players provide no network/audio. Automatic reduced motion remains intact; the removed visible motion toggle was not restored. No backend/API/schema/dependency/shared-shell changes, commits, deployment, paid resources or external actions occurred. Owned local preview/verification processes are stopped at handoff; evidence remains locally available.

### Room-selected music with local playback — accepted local technical candidate (05/10/2026)

Confirmed product direction supersedes the timestamp-correction and owner-local-ended advancement criteria below. Each device owns playback position; the room selects the track. **Only the joined owner's explicit Next action advances the shared selection.** Local ended/seek-to-end must not interrupt any other listener. The pending advancement-policy question is resolved; no further permission or product choice is needed for this implementation.

Lead owns the bounded player/session/helper/test/documentation changes; no Peer writer is dispatched. Preserve the accepted presentation, inherited Daily/API bytes, membership/freshness/role guards, audio preferences, shared-track identity/version and existing owner-only `POST /playback/next` contract. No backend/schema/dependency changes, external actions or release authority. Current acceptance requires two local mounted players to retain distinct positions without correction; local controls/ended must emit no shared selection change, and explicit authorized Next must still choose the approved queued track with expectedVersion. Retain lifecycle/buffering/autoplay/error/retry/cleanup checks. The earlier >3s drift tolerance, settlement/cooldown, one-correction target and automatic owner-ended advancement are historical criteria, not current requirements.

Implemented: removed room-clock position calculation, timestamp-derived player start, corrective seeks and owner-ended callbacks/effects. The player consumes only shared selection identity and reflects native local audio preferences; ENDED updates local replay status only. Snapshot polling/refetches do not align positions or restart an unchanged selection. Actual track changes still load the selected video and preserve each device's pause/mute/volume preferences. Owner Next remains directly available with the existing joined/freshness/busy guard and `expectedVersion`; approval alone does not advance. Empty-queue copy now says the room selection remains until explicit Next, rather than implying automatic Lofi Girl fallback. The backend's unchanged `next()`/`requireOwner()` still validates the active joined owner, open room and version; `startedAt` remains unused selection metadata in the unchanged API. The study rhythm legitimately retains server-clock synchronization.

Lead disposition: **ACCEPT this exact local technical candidate**, HEAD `312ce365202266f353c77289a1f93ea46be34264` plus the frozen working-tree inputs below. Start/end manifests match disk (SHA256 of `JSON.stringify(candidateEnd)`):

- Player: `/tmp/study-player-local-BhjSUm/results.json`, 6 entries, `f1518951e5981fce7976a4a8dd1f76fe0b421ce2cf55256030dcf2e984881212`; **20 checks**, zero recorded runtime errors.
- Mounted rooms: `/tmp/study-room-after-qMTgFL/results.json`, 17 entries, `7587f066d91e90b889ff867dd60390f68b36cb6e0134752d858219e4608fd360`; **39 checks**, zero recorded runtime/interception errors.
- Navigation's accepted 19-entry `/tmp/navigation-after-4sig7e/results.json` and Daily's 26-entry `/tmp/daily-ux-8i6B6g/results.json` remain byte-identical; all 30 inherited Daily/API paths match the entry manifest. No shared-shell or unrelated writes occurred in this increment.

Evidence: two fake native players retained positions **130/70 seconds** for the same selected track after ticks/refetches, with **zero app-issued seeks**. Pausing the first left positions **130/100**; seeking/ending the first left it at **599 (ended)** while the second reached **130 (playing)**, still on the same video. Selection replacement retained independent pause/mute/volume preferences. Mounted owner ENDED emitted no Next request/version change; explicit Next emitted exactly one POST with `expectedVersion: 4`, selected the approved queued video and incremented the version. STUDENT/ADMIN/LECTURER nonowners have no Next control and their local ENDED did not change selection. This verifies local frontend behavior with synthetic auth/API/YouTube, not backend authorization enforcement or real media/multiuser behavior.

Current screenshots inspected: [Owner locally ended, selection retained](/tmp/study-room-after-qMTgFL/owner-local-ended.png), [Owner explicit Next, selection changed](/tmp/study-room-after-qMTgFL/owner-explicit-next.png), [Desktop local music controls](/tmp/study-room-after-qMTgFL/member-music-1440.png), [320px music controls](/tmp/study-room-after-qMTgFL/member-music-320.png), plus two-player desktop/mobile fixtures. The updated local/shared copy is legible, owner Next stays alongside the music heading, and narrow controls wrap without overflow. Screenshots show synthetic player surfaces with no network/audio; they cannot establish playback quality. The dev-only query launcher remains visible in these renders.

Local verification: `pnpm build` PASS (existing >500 kB bundle warning); `pnpm lint` PASS (existing warnings, zero errors); Node tests **150/150**, zero failed/skipped, including five selection/owner-action checks; browser runner syntax and `git diff --check` PASS. Earlier `/tmp/study-room-after-OyJD4V` passed 39 checks but predates the empty-queue copy correction. `/tmp/study-room-after-rA0Wry` failed its Join-above-fold assertion while a stale snapshot warning was still present; the runner now waits for the intended synchronized preview before checking normal-entry layout. No application freshness guard was relaxed. Final evidence supersedes these attempts without relabelling the failed run a pass.

Exact changed paths for this local-playback increment (relative to repository root):

- `apps/web/src/features/study-room/components/study-music-player.tsx`
- `apps/web/src/features/study-room/components/study-room-session.tsx`
- `apps/web/src/features/study-room/lib/playback-selection.ts` (replaces the earlier local `playback-sync.ts`; correction helper removed)
- `apps/web/tests/study-playback-selection.test.ts` (replaces the earlier local `study-playback-sync.test.ts`; timestamp criteria obsolete)
- `apps/web/tests/fixtures/study-player.tsx`
- `apps/web/tests/study-player-browser-check.mjs`
- `apps/web/tests/study-room-ux-browser-check.mjs`
- `apps/web/README.md`
- `docs/architecture/study-rooms.md`
- `docs/architecture/web-ui.md`
- `docs/reviews/ux-flow-audit.md`

Downstream: use `/toolkit?tool=rooms` and `/study-rooms/:roomId` with the existing local API. Each listener can play/pause/seek/replay locally; a joined owner uses “Phát tiếp” to advance the approved queue or return to the default stream when empty. No unresolved advancement-policy decision remains. Product/design approval is separate. Actual YouTube buffering/autoplay/embed restrictions, real-backend authorization/membership persistence and live multiuser operation remain unverified; mocks do not close those gaps. Retry/remount can restart local position, with no claim of position persistence across iframe reloads. No backend/schema/contracts/dependencies were modified. No staging/commits/push/merge/deployment/external effects; owned local verification processes stopped at handoff. `/tmp` evidence is ephemeral.

### Navigation recheck and study-room presentation — accepted UI; playback criteria superseded above (05/10/2026)

Lead owned navigation/shared shell styles and study-room presentation, integration and acceptance; no moving write scope was delegated. The previously accepted navigation candidate was rechecked against fresh renders, and the mounted toolkit-room lobby and `/study-rooms/:roomId` session were traced and redesigned. Daily and unrelated dirty work were preserved. Room API/routes, active-account access, host-by-owner controls, explicit joining, one-room membership, heartbeat/lease accounting, music policy/moderation, versioned rhythm/playback, transfer and closure remain unchanged. Synthetic browser evidence does not establish real-backend authorization, multiuser synchronization or YouTube playback. No external/release authority is granted; technical acceptance remains separate from design approval.

Added local functional scope: diagnose reported YouTube failures/stuttering and implement evidence-supported playback corrections. Lead owns the mounted player and all shared room UI; no competing writer. Trace native API events, iframe lifecycle, local preferences, room clock freshness/reconnect and owner-only advance. First reproduce application-induced behavior with a deterministic delayed-seek/player fixture; distinguish that result from external buffering/autoplay/embed restrictions. Backend/schema/service replacement is not presumed necessary. Continue ready presentation work; do not claim smooth real YouTube playback from mock checks.

Read-only response loop: configured Peer `efe87a4c-bfd4-4dc4-b8c2-957b5ca05627` reviewed the frozen player/helper/session candidate; Lead **REJECTS the report as acceptance evidence** and closes the assignment. Its description contradicted itself about PLAYING-triggered seeking, misstated the cooldown operand, omitted requested hash proof, and overclaimed hook-level freshness. No actionable defect is accepted from that report. Lead retains source inspection and reproducible browser/test evidence as the acceptance inputs. Disposition sent to Peer; no dependent work uses the rejected report.

Rendered findings and design direction:

- Fresh navigation baseline `/tmp/navigation-after-xtAKES` represented the previously accepted shell, not the original historical navbar. Mobile Menu had lost its visible label; collapsed/tablet rails had two differently named triggers for the same drawer. Staff shortcuts put personal Daily work ahead of content management and omitted Documents. The recheck retains a visible Menu label, prioritizes Overview/Documents/Questions/Daily/Daily groups for staff, removes only the redundant rail trigger and strengthens active state with weight/background/edge marker. Below 360px the logo remains while adjacent brand text yields space to account/sign-in/Menu. Every destination remains in the role-aware full drawer; account/theme/guards/draft blockers remain intact.
- Room baseline `/tmp/study-room-before-TSowmF` put a large scene before Join or the timer, delaying the main task on both desktop and mobile. Toolkit added another enclosing card, and the textual roster repeated scene information. The frontend-design guidance informed a task-first composition using the existing Be Vietnam Pro, platform blue and light/dark tokens: a flat lobby; explicit preview/Join before the scene; a timer/recorded-time region beside the scene on desktop, horizontal timer/control grouping on tablet, and timer-first mobile. Scene headings now match functional typography rather than competing serif framing; overlapping decorative copy is removed, not required scene interactions.
- Music/request, queue and management use aligned task regions rather than equal-weight nested cards. The header music jump moves keyboard focus below the sticky header. Member details remain directly accessible from seats; the duplicate roster/accounting explanation is available on demand. Create focuses the name field; Cancel retains local input and sends no mutation. Existing rhythm/bell/phase feedback, host moderation, transfer/close confirmations and OS reduced motion remain. GPA was not redesigned.
- Final screenshot inspection caught an oversized error card caused by applying page minimum height and feedback styles to the same element. The session now keeps a compact error/loading panel inside the page shell. `/tmp/study-room-after-SyBm6V/room-error.png` confirms that correction. This was a rendered finding, not a conclusion from passing checks.

Historical playback diagnosis and bounded correction (timestamp correction and automatic ended advancement are superseded by the local-playback decision above):

- Before, `syncPosition` ran in the native PLAYING callback and local resume as well as polling. A delayed `seekTo` getter can emit PLAYING before its position settles, feeding another seek. The deterministic baseline `/tmp/study-player-before-OuG4C7/results.json` reproduced **41 seeks** and **one default-stream iframe rebuild** on a version-only advance. This establishes an application-induced failure mechanism, not the sole cause of the reported real playback lag.
- The earlier player corrected finite-video drift through the 3-second interval, with >3-second tolerance, 1.5-second settlement and a 10-second monotonic cooldown. Its fixture recorded **one correction and zero default-version rebuilds**. These correction criteria are obsolete: the current player makes no position corrections. Default livestream identity stability and preservation of local pause/mute/volume on actual selection changes remain required.
- That earlier candidate cleaned up callbacks/timers, ignored stale callbacks and retained owner-only finite ended advancement. **Ended advancement has now been removed**, while lifecycle safety and version checks for explicit Next remain. Error 153 feedback, explicit retry and the existing external-link fallback remain. API lifecycle, deployed referrer policy, clock/polling/heartbeat and backend version advancement were inspected. No evidence justified a backend/schema/API change or new playback architecture. Actual network buffering, autoplay and region/embed restrictions remain unverified.

Historical Lead disposition: **ACCEPT the then-current integrated technical candidate** (room/player playback behavior superseded by the section above), HEAD `312ce365202266f353c77289a1f93ea46be34264` plus the working tree identified by these matching source/test/input manifests (SHA256 of `JSON.stringify(candidateEnd)`):

- Navigation: `/tmp/navigation-after-4sig7e/results.json`, 19 entries, `6fbe6e42091978f67f4527934e7399aaa1506a219dd063da030692a0e81c0b92`.
- Rooms: `/tmp/study-room-after-SyBm6V/results.json`, 17 entries, `24f7ca195f250bf53bbe76dde312dfae1eb560f72dbfd5215c83cfd016c11525`.
- Player: `/tmp/study-player-after-odKD0C/results.json`, 5 entries, `f0f986948634cba5b7c45ddc72d8034e8c3e8d718ca87cc6c53f6f1b96cb086f`.
- Preserved Daily regression inputs: `/tmp/daily-ux-8i6B6g/results.json`, 26 entries, `57f84dd139fb621911a27ea774771c42e060b41c51a08f025e201fece7bc84b8`.

All start/end entries match and were reverified against disk; unchanged guards/hooks/services in manifests are accepted integration inputs, not claims of edits. Acceptance rests on inspected source, current renders and reproducible local behavior. **It is not product/design approval, proof of smooth actual YouTube playback, or authority for external/release actions.** Prior rejected assessments/reviews remain excluded.

Final verification: `pnpm build` PASS (existing >500 kB warning); `pnpm lint` PASS (existing warnings, zero errors); `node --test --test-isolation=none tests/*.test.ts` PASS **150/150**, zero skipped/failed; navigation browser **32 checks**, rooms **38**, player **17**, Daily **37**, each with zero recorded runtime/interception errors. Room checks cover guest/no snapshot access, preview without heartbeat, explicit Join, create/cancel/focus, member dialog focus return, request/moderation/next, uncached SPA loading, offline/reconnect, leave, transfer dialog, explicit closure, empty/error/retry, 50-member pagination, nonowner ADMIN/LECTURER restrictions and reduced motion. Player checks cover StrictMode, rerenders, delayed seek feedback, pause/buffering/settlement/cooldown, freshness recovery, video replacement, stale/ended callbacks, autoplay gesture, errors/retry, API-script failure and late initialization cleanup. These are synthetic API/auth/player checks, not backend enforcement or real-time media proof. Hash comparison verifies all 30 inherited Daily/API paths unchanged; `git diff --check` passes, staging remains empty.

Current screenshot comparisons (local files; `/tmp` evidence is ephemeral):

| Surface | Before | Current | Observed change |
| --- | --- | --- | --- |
| Navigation desktop, collapsed | [Before](/tmp/navigation-after-xtAKES/student-collapsed-desktop.png) | [Current](/tmp/navigation-after-4sig7e/student-collapsed-desktop.png) | One drawer entry; clearer active state/group label |
| Navigation tablet, admin dark | [Before](/tmp/navigation-after-xtAKES/admin-1024-dark.png) | [Current](/tmp/navigation-after-4sig7e/admin-1024-dark.png) | Content-first labelled shortcuts; no duplicate discovery trigger |
| Navigation mobile, guest | [Before](/tmp/navigation-after-xtAKES/public-390-light.png) | [Current](/tmp/navigation-after-4sig7e/public-390-light.png) | Visible Menu alongside direct sign-in |
| Room desktop, member | [Before](/tmp/study-room-before-TSowmF/member-1440.png) | [Current](/tmp/study-room-after-SyBm6V/member-1440.png) | Timer beside the scene, no scene-first scrolling |
| Room tablet, member | [Before](/tmp/study-room-before-TSowmF/member-1024.png) | [Current](/tmp/study-room-after-SyBm6V/member-1024.png) | Timer/control region before the scene |
| Room mobile, preview | [Before](/tmp/study-room-before-TSowmF/preview-390.png) | [Current](/tmp/study-room-after-SyBm6V/preview-390.png) | Explicit Join visible before the scene |

Lead inspected current desktop/tablet/mobile light/dark navigation, collapsed rail/account and short drawers; final room desktop/tablet/mobile, 320px timer, dark mobile, preview/lobby/music, error/closed/long-name/reduced-motion states and iteration create/rhythm/transfer/queue/management screenshots. Not every screenshot is an independently inspected visual assertion. Narrow 320px header actions wrap intentionally; short room forms scroll normally rather than promising all fields above the fold. Long room names still consume vertical space. The dev-only query launcher remains visible in evidence and overlaps some bottom edges; it was not hidden to manufacture polish.

Failed/incomplete runs remain separate: room `/tmp/study-room-after-weeUIY` clicked before the lobby mounted; `/tmp/study-room-after-IYBxFP` incorrectly expected loading for cached data; `/tmp/study-room-after-rjzxYp` compared a changing sync aria-label rather than opener identity; `/tmp/study-room-after-4Jhyr9` attempted Close while a preceding mutation disabled it. The runner now foregrounds its tab, checks actual focus-element identity and waits for enabled controls; no app freshness/access rule was relaxed. Player `/tmp/study-player-after-p44qGu` replayed PLAYING after pause in the fake, `/tmp/study-player-after-kjYEY7` acted before replacement readiness, `/tmp/study-player-after-SpTJtI` attempted to serialize Window, and `/tmp/study-player-after-UkUa1b` hit a Chromium startup timeout during overlapping work. Repaired fixtures/runners and complete final runs supersede these attempts; the intermediate 38-check `/tmp/study-room-after-XFQOo7` and 17-check `/tmp/study-player-after-tSlv1N` predate the compact error-panel correction.

Exact changed paths for this increment, relative to `apps/web` unless noted:

- Navigation: `src/layouts/dashboard-layout.tsx`, `src/layouts/navigation.ts`, `src/layouts/navigation.css`, `src/layouts/components/public-header.css`; `tests/navigation.test.ts`, `tests/navigation-browser-check.mjs`.
- Room/toolkit: `src/features/toolkit/components/toolkit-feature.tsx`, `src/features/toolkit/components/toolkit.css`; `src/features/study-room/components/study-rooms-lobby.tsx`, `study-room-session.tsx`, `study-room.css`, `study-room-scene.tsx`, `study-room-scene.css`, `study-music-player.tsx`; then-new `src/features/study-room/lib/playback-sync.ts` (since replaced by `playback-selection.ts`).
- New local verification: `tests/study-room-ux-browser-check.mjs`, then `tests/study-playback-sync.test.ts` (since replaced by `study-playback-selection.test.ts`), `tests/study-player-browser-check.mjs`, `tests/fixtures/study-player.html`, `tests/fixtures/study-player.tsx`.
- Guidance/status: `AGENTS.md`, `README.md`; repository `docs/architecture/web-ui.md`, `docs/architecture/study-rooms.md`, `docs/reviews/ux-flow-audit.md`.

Downstream: run the documented local web commands, open `/toolkit?tool=rooms`, preview/join an existing room or create one using the matching local API, and inspect `/study-rooms/:roomId`. The candidate is ready for Human design evaluation against the comparisons, not declared aesthetically approved. Actual YouTube/audio, backend authorization/membership persistence, sustained live multiuser synchronization, physical mobile devices, WebKit and screen-reader/zoom validation were not exercised in this externally blocked local fixture environment. Real playback uncertainty remains a validation follow-up, not permission for live accounts/multiuser coordination. No backend files or dependencies were changed; no commits, push, merge, deployment or external effects occurred. Owned Vite/Chromium verification processes were stopped at handoff; evidence directories remain available locally.

### Platform navigation redesign — historical technical acceptance, superseded by the current recheck above (05/10/2026)

Lead owns the shared navigation shell, styles, integration and verification; no Peer owns a moving write scope. Authorized scope is public/authenticated headers, dashboard/sidebar/drawer navigation and associated motion controls, not unrelated page bodies or access rules. Preserve the accepted Daily functionality and preexisting API work. Technical acceptance will not establish product/design approval.

Design plan: retain Be Vietnam Pro and platform light palette (#f0f6f8 background, #ffffff surface, #102d42 text, #00387b action, #526b7a secondary, #cddce3 separator), with existing dark tokens. Public navigation is aligned to the content container instead of an independently floating card. Wide screens show primary discovery destinations; tablets retain the most-used discovery links and full menu access; mobile keeps account/sign-in and a clear menu entry. Workspace navigation gives personal/content/system tasks priority, with public discovery accessible separately. Wide screens have a readable collapsible sidebar; tablets have a labelled shortcut rail and full drawer; mobile has a compact header and the same drawer. No new fonts, assets, paid service or dependency.

Motion direction supersedes the earlier subtle-only constraint: expressive drawer/content reveals and active-state/sidebar transitions are allowed, but actions remain immediately available and OS reduced motion suppresses animation. The visible motion control is actually HomeMotionToggle (desktop “Nền động”) and the PublicDisplaySettings motion switch (compact menu). Remove both and now-unused UI/preference plumbing; preserve theme settings. Home motion will use automatic prefers-reduced-motion instead of a removed manual control.

Plan critique: avoid a generic icon-only dashboard rail or equal-weight mega-menu. Label tablet shortcuts, retain role context and group secondary discovery below workspace tasks. Borders define shell/content boundaries rather than multiple nested cards. The school logo remains the brand anchor; animation explains user-triggered changes rather than adding decorative continuous motion. Fresh baseline and candidate Chromium screenshots, keyboard/draft/role checks and required local web checks will determine technical disposition. Synthetic auth/API fixtures are not real-backend authorization proof.

Rendered baseline and iteration findings:

- Baseline `/tmp/navigation-before-bDBIAs`: desktop public header floated on edges unrelated to the functional body; at 1024px the public header was mostly empty and hid all discovery/sign-in behind Menu. Admin sidebar repeated the whole public directory after work destinations, with scrolling and truncated system labels. At 320×360 the public menu showed introductory copy and display settings before any actual destination. Baseline captures used synthetic auth/API and the same external-asset block as the candidate.
- Final `/tmp/navigation-after-TojuF9`: public brand/body edges align; tablet has three direct discovery links; sign-in is direct on mobile. Admin 1440px shows all workspace destinations, legible system labels and a separate discovery entry without a permanent public-directory list. Staff content/system work now leads after Overview; Daily/profile remain accessible below. Tablet uses a labelled 88px rail rather than shrinking the full sidebar. The short public drawer exposes four learning destinations immediately; the short student drawer exposes Daily/groups and personal destinations. These are observed fixture composition improvements, not a usability-study result.
- The first rendered rewrite still put staff personal work before content management; current grouping was reordered following screenshot inspection. Collapse now transfers focus to the replacement control. Multiple drawer triggers required explicit actual-opener focus return rather than the last registered Radix trigger. Desktop/tablet/mobile use one drawer implementation and a single scrollable destination region; primary nav links remain interactive during the 360ms reveal, not gated behind animation completion. The screenshot set includes an in-flight drawer capture and reduced-motion static captures.

Lead disposition: **ACCEPT the exact local technical navigation candidate**, HEAD `312ce365202266f353c77289a1f93ea46be34264` plus the matching 19-entry source/test/guard/deletion manifest in `/tmp/navigation-after-TojuF9/results.json`. SHA256 of `JSON.stringify(candidateEnd)`: `0b0303c28743502c0855e53b392267344ffe94211ad68d0d98b05d7fc274a552`. Start/end match and all present/absent entries were reverified against disk. The manifest includes unchanged guards as integration inputs; it does not mean they were edited. No Peer was delegated in this shell task; prior rejected Daily Peer reports remain excluded. **Product/design approval remains Human's and is not established by this disposition.** No external/release authority follows.

Verification:

- Final `pnpm build`: PASS, TypeScript + Vite; existing >500 kB chunk warning remains.
- Final `pnpm lint`: PASS, zero errors; existing shared primitive/routes/fixture/upload warnings remain, none introduced in the redesigned shell.
- `node --test --test-isolation=none tests/*.test.ts`: PASS, 145/145, zero failed/skipped. Five new navigation tests verify destination preservation, role-aware regrouping/shortcuts, deepest/query/alias active matching and removal of motion UI without removing OS/theme support.
- `node tests/navigation-browser-check.mjs`: PASS, 28 recorded check groups, zero runtime/interception errors; 53 screenshots; synthetic logged-out/STUDENT/LECTURER/ADMIN public/workspace contexts, 1440/1024/768/390 and 320×360, light/dark, 767/768/1199/1200 breakpoint checks, modal Tab/Escape/opener return, collapse focus, account keyboard/logout flow, student staff-route guard, dirty Daily drawer navigation, removed visible motion controls, retained theme switch and OS reduced motion. This is browser behavior with synthetic credentials, not backend enforcement proof.
- `node tests/daily-ux-browser-check.mjs`: PASS, 37 checks, zero errors, matching 26-file manifest, `/tmp/daily-ux-xxY0oK`. UTC+7 today/explicit dates, draft/refetch/calendar safety, Save/Submit/first timestamp, task/evidence/reflection, group consent/revocation and feedback behavior pass their existing synthetic regression checks.
- All 26 previously accepted Daily source/test bytes match `/tmp/daily-ux-nxa7UH/results.json`; the four preexisting API changes were separately hash-verified unchanged. Route definitions/guards/auth behavior are preserved. No page body, access rule or API was redesigned. Shell CSS hides duplicate Daily area links only where the sidebar/rail provides the same direct destinations.
- `git diff --check`: PASS; no staged paths, commit, push, merge, deployment, paid resource or external action. Task-owned Vite/Chromium processes were stopped at handoff.

Lead inspected final public desktop/tablet/mobile light and desktop/mobile dark; student desktop dark, tablet light and drawer; lecturer desktop/tablet/mobile and drawer; admin desktop light/tablet dark/mobile dark; 320×360 public/student drawers and Daily shell; Daily desktop/tablet shell, account mobile menu, in-flight drawer, home OS-reduced-motion tablet and retained login shell. Representative before/after pairs: `public-1024-light.png`, `admin-1440-light.png`, `public-menu-320x360.png` in the baseline/final directories. The full final image set and matching results are available locally.

Failed results are retained separately: `/tmp/navigation-after-61amPe` timed out on a Daily fixture missing required createdAt/updatedAt fields; strict contract rejection was correct, so the fixture was repaired, not the production contract. `/tmp/navigation-after-Zh7WNO` timed out when the runner used programmatic click to reopen a Radix account trigger; it was corrected to a real keyboard Enter event. Neither incomplete run is acceptance evidence.

Changed paths for this shell task (relative to `apps/web` unless stated): `src/layouts/dashboard-layout.tsx`, `public-layout.tsx`, `public-layout.css`, `navigation.ts`, `navigation.css`; `src/layouts/components/public-header.tsx`, `public-header.css`, `navigation-groups.tsx`, new `navigation-drawer.tsx`, `public-display-settings.tsx`; `src/features/auth/components/user-dropdown.tsx`; `src/features/home/hooks/use-home-motion.ts`; removed `src/features/home/components/home-motion-toggle.tsx` and `src/stores/use-home-motion-store.ts`; new `tests/navigation.test.ts`, `tests/navigation-browser-check.mjs`; `AGENTS.md`, `README.md`; repository `docs/architecture/web-ui.md` and this existing status source. Deleted code is recoverable from Git/this working diff; no user data or stored preferences were deleted. Old home-motion storage is no longer consumed.

Limits/downstream: local Vite/headless Chromium with synthetic API/auth and blocked external fonts/video, not live-backend authorization/session/privacy/persistence, WebKit, physical touch devices, zoom/screen-reader testing or sustained performance profiling. Dev-only query-tool launcher is visible and overlaps some bottom edges in evidence; it was not hidden to manufacture a clean capture. Narrow public headers use an accessible named Menu icon rather than visible text; uncommon tablet destinations take one Menu action, a deliberate hierarchy tradeoff. Auth-card page bodies/footer and legacy reusable sidebar primitives are not redesigned. No new implementation permission is needed to try the candidate using the documented local commands. Human can now evaluate the current screenshot comparisons; aesthetic approval remains unresolved.

### Daily presentation redesign — TECHNICALLY ACCEPTED; DESIGN EVALUATION PENDING (05/10/2026)

Human rejected the visual quality of the compact-date candidate. Its local technical checks remain historical evidence, not product/design acceptance. Lead owned all writes in this scoped presentation rewrite; no Peer owned a moving write scope. The matching 26-file `/tmp/daily-ux-X3BdkA/results.json` snapshot is the rendered baseline, not evidence for the new result. The four preexisting API plan-date changes and other unrelated working-tree inputs were not edited.

Rendered critique: the baseline has a consistent platform palette, readable headings/actions and recognizable completion states, but wide empty task/progress rows, detached controls, excessive mobile framing before the first task, uneven weekly-statistic wrapping, and repetitive equal-weight group cards undermine hierarchy. Passing checks did not establish design quality. The 10+ years framing is an evaluation standard, not a claim of professional tenure.

Design direction and usable result:

- Existing light palette: background #f0f6f8, work surface #ffffff, text #102d42, action #00387b, secondary #526b7a, separators #cddce3; existing dark counterparts remain. Be Vietnam Pro, 28–30px page titles, 16px section headings, restrained supporting text. Reuse platform primitives, 44px primary controls, and short interaction motion; no new font, gradient, illustration or continuous animation.
- Day: one main work surface, compact progress, Add next to the task heading, and visible reflection alongside on desktop/below on mobile. Titles no longer have permanent input outlines; hover/focus reveals edit affordances. Completion/title/priority remain direct. Reorder/delete use a small keyboard-accessible contextual menu, not a closed primary-task panel. Wide content containers use single-row tasks; narrow containers use two rows with a labelled accessible paperclip control. Save/Submit stay distinct and sticky, and the first-submission state/timestamp is in the header.
- Week: reflection is the main work area; all recorded statistics remain beside it on desktop/below on mobile, with calculation definitions on demand. Save is sticky; an unsaved weekly review is not labelled saved. Shared review uses the same work/side-column composition, with identified feedback alongside reading and direct focus-aware reflection/feedback shortcuts.
- Groups: aligned member rows replace the repeating card/dashboard grid. Private members disclose no counts; allowed summaries keep completion/MUST counts and submission timing. Date/back/refresh share the header, and sharing management remains directly reachable. Invitation/avatar/leave/audience capabilities and explicit consent/OFF are retained.
- Dirty state is communicated in the action bar instead of a persistent duplicate content banner. Errors/conflicts/blocked navigation remain prominent. Replacing a dirty owner draft from the server requires explicit confirmation. Existing UTC+7 today, deep-link/intentional-date selection, same-date safety, Save/Submit lifecycle and access checks remain unchanged. CSS explicitly preserves hidden access-check content despite the new grid layouts.
- Local skill discovery inspected accessible skills/tool surfaces. `find-skills` guided discovery; `olympic-context` located ownership; `frontend-design` and project guidance influenced the task-led asymmetric composition, typography, meaningful surfaces and screenshot-led revisions. No remote skill was installed or executed. Skill use is not design evidence.

Rendered iterations: the first rewrite still wrapped Add and task tools at 320px and over-framed shared-review shortcuts. Subsequent renders informed shorter task framing, mobile icon controls with accessible names, width-aware single-row desktop tasks, header-level group date selection and a leaner feedback area. Final day desktop shows about seven work rows instead of four; at 390px the task rows are about 105px rather than 170px. Reflection/feedback are visible beside the work rather than after the whole desktop list. These are observed fixture improvements, not a general usability-study result.

Lead disposition: **ACCEPT the exact local technical candidate**, HEAD `312ce365202266f353c77289a1f93ea46be34264` plus the matching start/end 26-file manifest in `/tmp/daily-ux-nxa7UH/results.json`. SHA256 of `JSON.stringify(candidateEnd)`: `57f84dd139fb621911a27ea774771c42e060b41c51a08f025e201fece7bc84b8`. All entries were rechecked against disk after the interrupted turn resumed. The manifest includes preserved integration inputs; it does not mean all 26 files were authored in this rewrite. **Product/design acceptance remains pending Human evaluation of the revised screenshots.** No release/external authority follows from this disposition.

Fresh independent read-only response disposition: **REJECT as acceptance evidence**. It explicitly could not inspect images but nevertheless claimed no composition regressions; it also confused 26 manifest files with 37 browser check groups. The stated image-tool limitation is recorded; its broad visual/source/hash claims are excluded. Lead sent the disposition, requested no further work, and retained ownership. The prior rejected reports remain excluded. Acceptance relies on Lead's own source/hash verification, executed checks and rendered inspections.

Final verification:

- `pnpm build`: PASS, TypeScript + Vite; existing >500 kB bundle warning remains.
- `pnpm lint`: PASS, zero errors; existing shared UI/routes/figure-fixture/upload warnings, none in Daily.
- `node --test --test-isolation=none tests/*.test.ts`: PASS, 140/140, zero failed/skipped. Weekly-statistic source guards now follow the shared component, retaining all six required figures and calculation definitions.
- `git diff --check`: PASS. No staging/commit/push/merge/deployment or external mutation.
- `node tests/daily-ux-browser-check.mjs`: PASS, 37 check groups, zero recorded runtime/interception errors, 62 synthetic API requests, matching source manifests. Includes UTC+7 today under Los Angeles timezone; midnight/refetch draft retention; explicit/invalid dates; keyboard calendar/month/jump/focus; history pending/error/empty/show-more; add/cancel/Escape; Save/Submit/busy/first-timestamp retention; dirty navigation/conflict/reload confirmation; keyboard reorder/boundaries/menu Escape; removal focus transfer; sharing audience/explicit ON/OFF/Stay-then-Save; feedback Stay/explicit discard; weekly save and reduced motion.
- Lead inspected current `day-desktop-light.png`, `day-desktop-dark.png`, `day-390-light.png`, `day-390-dark.png`, `day-320-light.png`, `day-320-tasks.png`, `task-menu-desktop.png`, `week-desktop-light.png`, `week-320-light.png`, `group-desktop-dark.png`, `group-members-320-light.png`, `shared-desktop-light.png`, `shared-320-light.png`, `feedback-390-light.png`, `shared-week-320-light.png`, `history-desktop-light.png`, `calendar-320x360.png` and `dialog-320x360.png` in that directory. Other calendar/theme/guard captures and results are available there. Existing preview screenshots/build success were not substituted for this inspection.

Intermediate failed results remain separate: `/tmp/daily-ux-nN65I4` timed out because the fixture dismissed the newly required reload confirmation; `/tmp/daily-ux-QML8pG` used the obsolete reflection shortcut label. The fixture was corrected to test cancellation/explicit acceptance and the current shortcut, without removing those behavioral checks. Other passing intermediate captures do not validate the final snapshot.

Paths changed in this rewrite, relative to `apps/web`: `src/features/daily/components/daily-plan-editor.tsx`, `daily-week-editor.tsx`; `src/features/daily/groups/feedback-panel.tsx`, `groups.css`; `src/features/daily/evidence/evidence-panel.tsx`; `src/features/daily/ui/study-notebook.tsx`, `study-notebook.css`; `src/pages/daily-groups-page.tsx`, `daily-shared-review-page.tsx`; `tests/daily-study-ui.test.ts`, `daily-wire.test.ts`, `daily-ux-browser-check.mjs`; `README.md`, plus this existing repository status document. Date/state/API input files from the earlier candidate were preserved.

Limits/downstream: current evidence is local Vite + Chromium with synthetic API interception, desktop 1440px/mobile 390/320px and low-height 320×360 controls, not real-backend persistence/auth/revocation proof, WebKit or physical-device testing. Dev-only query tooling remains visible in captures and can overlap an action edge; the installed devtools export returns null outside development, verified from its source, not a production visual claim. Fixture coverage does not establish comprehension of borderless title editing or icon-only mobile evidence; those remain design-evaluation tradeoffs. Weekly facts are intentionally below reflection on mobile, not removed. Human can evaluate the linked before/after renders or run the documented local preview/browser check; production-like backend testing remains separate. No new product decision is needed to use the local candidate; aesthetic approval remains unresolved. Task-owned preview is stopped at handoff.

### Daily compact-date / flat-workspace refinement — historical TECHNICAL acceptance (05/10/2026)

Historical entry-flow implementation retained for context; its presentation is superseded by the redesign above. Scope: local frontend refinement, integration, checks and existing documentation; no commit, push, merge, deployment, paid resource or external effect. Lead retained write ownership throughout that refinement; no new Peer was delegated then. The earlier rejected assessment and integration-review reports remain excluded and closed. The four existing API plan-date changes and unrelated working-tree inputs were not edited.

Usable flow and decisions:

- `/daily` opens today's editor using the existing `Asia/Ho_Chi_Minh` / UTC+7 civil-date contract. Today is captured once per day-screen entry, not recomputed during editing/refetches. Explicit dates and intentional selections remain authoritative; invalid/empty explicit dates produce an error instead of falling back to today. `/daily?view=history` retains truthful saved-week loading/error/empty/history/show-more; existing `?week=` links still open history.
- Day/week/group/shared screens have one compact click-open date control. A Monday-first 42-day calendar, month controls, date jump and Today preserve arbitrary day/week access. Contextual links retain weekly reflection, individual days and saved history without expanded seven-day surfaces or a calendar repeated for every group member.
- Flat content edges, normalized gaps and separator rows replace competing nested card treatments. Desktop reuses the existing sidebar instead of duplicate Daily tabs; mobile retains direct area access. Desktop task evidence shares the controls row when collapsed; narrow screens wrap controls without reducing the 44px task action targets. Completion, priority, reorder and delete remain direct, not buried in closed option panels. Both supported task states (`TODO`/`COMPLETED`), all priorities, evidence and add-to-draft semantics are preserved.
- Date/Add actions share the mobile header row. Reflection is open by default with a shortcut beside the task heading. Save/Submit remain sticky and distinct, with visible first-submission status and preserved first timestamp. Weekly figures use two mobile columns so reflection is nearer; shared review has shorter framing, aligned identity/progress, and direct reflection/feedback jumps. Required sharing, audience, invitation, avatar and leave-group capabilities remain accessible.
- Dirty/busy/conflicting day/week edits block selection without changing the URL/form. Group-sharing and feedback navigation blocks focus the actual Stay/discard prompt and retain the draft; only explicit discard authorizes leaving. A rendered regression uncovered a stale router-blocker effect after Stay followed quickly by Save; `use-daily-editor.ts` now consumes each blocked request once so a canceled request cannot later proceed or crash the route. Explicit sharing consent and saved OFF remain intact.
- The frontend-design guidance influenced the flat task workspace, restrained token reuse, reduced repeated framing and screenshot-led spacing critique. Existing short interaction motion, reduced-motion handling, native dialogs and focus management remain; the popover adds roving grid focus and Escape/focus return, not continuous animation.

Lead disposition: **ACCEPT** the exact HEAD `312ce365202266f353c77289a1f93ea46be34264` plus local frontend candidate identified by the 26-file SHA256 start/end manifest in `/tmp/daily-ux-X3BdkA/results.json`. SHA256 of `JSON.stringify(candidateEnd)` is `1626dd766d50b8f8688ae02612812c0203da8a83c8e991c45ec5189db9febb90`. Both manifests match, and every entry was rechecked against disk after verification. The manifest includes preserved inputs for integration context; it is not a claim that all 26 paths were newly authored. Documentation records this decision separately from the UI snapshot.

Verification of the final candidate:

- `pnpm build`: PASS (TypeScript + Vite); existing >500 kB bundle warning remains.
- `pnpm lint`: PASS, zero errors; existing warnings in shared UI/routes, figure fixture and document upload code, none in Daily files.
- `node --test --test-isolation=none tests/*.test.ts`: PASS, 139/139, no failures/skips. The obsolete weekly-summary helper assertion was replaced by assertions for every required displayed statistic, not removed without replacement.
- `git diff --check`: PASS; no staged changes.
- `node tests/daily-ux-browser-check.mjs`: PASS, 35 check groups, no recorded runtime/interception errors. Current local Vite/Chromium with intercepted synthetic API responses; desktop 1440px, mobile 390/320px, calendar/dialog 320×360px, light/dark, keyboard and reduced motion. Controlled advancing clock + Los Angeles browser timezone verifies UTC+7 today, midnight/refetch draft retention, explicit/invalid dates, route/query preservation, same-date safety, week normalization, arrow/Home/End/Page Up/Down traversal, Tab exit, Enter/Space/native jump selection, Escape/outside dismissal and trigger focus restoration. It also verifies history states, add/cancel/Escape, busy gating, first submission retention, conflict/reload, synthetic save/reopen, sticky actions through scrolling, group-wide date links, sharing audience retention/explicit ON/OFF, Stay-then-Save, feedback Stay/explicit discard and weekly save.
- Lead inspected final screenshots in that directory, including `day-desktop-light.png`, `day-390-light.png`, `day-320-tasks.png`, `day-390-dark.png`, `calendar-320-light.png`, `calendar-320x360.png`, `calendar-390-dark.png`, `group-members-320-light.png`, `group-desktop-dark.png`, `sharing-dirty-date-320.png`, `feedback-dirty-date-390.png`, `week-320-light.png`, `shared-320-light.png`, `shared-week-320-light.png` and `history-desktop-light.png`. Rendered critique repaired the extra desktop evidence row, contrasting progress shell, mobile section-action wrapping, long weekly framing and orphaned shared-review controls. Final renders show consistent edges and usable wrapping; in short viewports the bounded popover scrolls and its bottom controls remain reachable.

Failed/unknown results remain separate: earlier runs failed on a frozen test clock, premature route-render assertions, the invalid-date harness expecting a notebook wrapper, and a premature second blocker interaction. `/tmp/daily-ux-vCNHU8` preserves the actual Stay/Save router crash found and repaired; earlier passing intermediate screenshots do not validate subsequent refinements. Acceptance uses only the final matching snapshot and completed checks, not the rejected Peer reports or stale screenshots.

Changed paths for this refinement (relative to `apps/web`, unless stated otherwise):

- New compact selection: `src/features/daily/lib/date-selection.ts`, `src/features/daily/ui/study-date-picker.tsx`.
- Pages: `src/pages/daily-owner-page.tsx`, `src/pages/daily-week-page.tsx`, `src/pages/daily-groups-page.tsx`, `src/pages/daily-shared-review-page.tsx`.
- Editors and draft integration: `src/features/daily/components/daily-plan-editor.tsx`, `src/features/daily/components/daily-week-editor.tsx`, `src/features/daily/hooks/use-daily-editor.ts`.
- Group/feedback/evidence: `src/features/daily/groups/group-controls.tsx`, `src/features/daily/groups/feedback-panel.tsx`, `src/features/daily/groups/groups.css`, `src/features/daily/evidence/evidence-panel.tsx`.
- Presentation: `src/features/daily/ui/study-notebook.css`, `src/features/daily/ui/study-section.ts`.
- Verification: `tests/daily-study-ui.test.ts`, `tests/daily-wire.test.ts`, `tests/daily-calendar-presentation.test.ts`, `tests/daily-ux-browser-check.mjs`.
- Guidance/status: `README.md` and repository `docs/reviews/ux-flow-audit.md`.

Limits/downstream: start the web app against the matching local API and open `/daily`, an explicit historical date, `/daily?view=history`, `/daily/week?weekStart=YYYY-MM-DD` or `/daily/groups`. Personal saved history still depends on the existing plan-dates API input. The browser evidence is **synthetic**, not real-backend save/reopen, auth, consent/revocation enforcement or evidence-byte delivery proof. No API tests were rerun for this frontend-only refinement. Chromium emulation is not physical mobile, WebKit, assistive-technology or soft-keyboard validation; theme states were sampled, not exhaustive. Screenshots include Vite's development-tool launcher. Temporary evidence can be regenerated using the checked-in runner. Task-owned Vite/Chromium runtimes are stopped at handoff. No product decision blocks this local candidate; real-backend/device verification remains the next release/integration checkpoint, not claimed complete here.

### Daily task-first hierarchy — historical accepted candidate, superseded above (05/10/2026)

Scope: improve the current local Daily working tree; no commit, push, merge, deployment, external effects or paid resources. Existing backend plan-date changes are preserved; this increment owns frontend integration, tests and documentation only. The earlier local acceptance below remains historical, not visual evidence for this candidate.

Delivered route: compact date context and one progress group; visible first-submission status; sticky Save/Submit actions; temporary add-task dialog with explicit add-to-draft and cancellation; task ordering/deletion available on demand. Group member cards retain permitted day progress and direct day/week access, with other calendar weeks collapsed by default. These group choices are explicitly not claimed as saved history. Sharing remains explicit, with a direct access point and selected-audience drafts retained when hidden. Reflection/feedback shortcuts open mounted disclosures and move focus. Personal planned-week history distinguishes pending/error/empty/saved data and never inserts a calendar-only selection; long history uses show-more. Nested calendar grids fit container width and omit redundant icons in narrow member cards. Motion is short, interaction-led and disabled for reduced motion.

Contract reconciliation: the current persisted MVP accepts `TODO`/`COMPLETED` only (API enum, V18 constraint and Daily wire tests). Older text also described `IN_PROGRESS`; that third wire state is not delivered. This UI preserves both supported states and all priorities. Adding a third persisted state is deferred to a separate product/API/schema decision, not simulated in the UI. Save remains distinct from Submit; neither enables group sharing, and repeated submission keeps the first timestamp.

Lead disposition: **ACCEPT** the exact local frontend candidate at HEAD `312ce365202266f353c77289a1f93ea46be34264` plus the scoped working-tree changes, identified by the 20-file start/end SHA256 manifest in `/tmp/daily-ux-rbT5Aq/results.json`. All manifest entries matched before/after the rendered check. Acceptance is grounded in direct source inspection, current rendered artifacts and completed local checks, not the earlier assessment reports or historical screenshots. The frontend-design critique influenced the task-first grouping, shorter framing, restrained motion and legible nested-calendar treatment. No required capability was intentionally removed. Existing backend plan-date changes and the prior editor type compatibility change remain preserved inputs, not newly authored backend work.

Verification:

- `pnpm build`: PASS, TypeScript and Vite production bundle; existing >500 kB chunk warning remains.
- `pnpm lint`: PASS, zero errors; warnings remain in shared components/routes, the existing figure fixture and document upload code, not Daily files.
- `node --test --test-isolation=none tests/*.test.ts`: PASS, 136/136, zero failures/skips.
- `git diff --check`: PASS.
- `node tests/daily-ux-browser-check.mjs`: PASS, 18 check groups, no recorded runtime/interception errors; current local Vite and Chromium, stateful synthetic API responses, 12 initial tasks/6 members. Desktop 1440px, mobile 390/320px, dialogs 320×360px; light/dark, keyboard completion, modal background inertness/focus return, disclosure keyboard activation, focus shortcuts and reduced motion. Save/Submit remain visible at entry, through scrolling and at page end. Tests cover temporary add/cancel/Escape, busy/dirty gates, first submission retention, conflict draft/reload, simulated save/reopen, on-demand calendar choices and audience draft preservation without implicit consent.
- Lead inspected current screenshots including `day-desktop-light.png`, `day-390-light.png`, `day-320-tasks.png`, `group-desktop-dark.png`, `group-history-320-light.png`, `group-dialog-320x360.png` and `feedback-390-light.png` in that evidence directory. Rendered critique caught and repaired doubled page spacing and excessively narrow/tall nested week cards; an overflow pass alone was insufficient.

Evidence exclusions/limits: earlier browser attempts failed on driver Escape/Enter encoding, translated-label expectation and an over-strict native modal focus assertion; those failures are not acceptance evidence. Native Chromium tab traversal can pass through BODY at a browser boundary; final checks separately verify no background control receives focus and modal background controls are inert. Earlier assessment reports remain REJECTED. The bounded four-path independent integration review is also REJECTED as acceptance evidence and CLOSED: it omitted requested snapshot hashes and artifact proof and claimed rendered behavior without a runtime. Lead's direct verification supplies the acceptance basis; there is no pending Peer dependency.

The browser proof is **synthetic**, not new real-backend save/reopen, authentication, consent/revocation, avatar/evidence byte delivery or security proof. API tests were not rerun in this frontend increment, and the four existing API changes were not edited. Chromium emulation is not physical-device, WebKit, screen-reader or soft-keyboard validation; dark rendering was sampled, not every state exhaustively reviewed. Vite screenshots include its development tooling launcher. Temporary evidence can be regenerated with the checked-in runner; old HTTP-harness screenshots do not validate this candidate.

Changed frontend paths (relative to `apps/web`; the manifest also includes the preserved `src/features/daily/lib/plan-editor.ts` input):

- Editors: `src/features/daily/components/daily-plan-editor.tsx`, `src/features/daily/components/daily-week-editor.tsx`.
- Routes: `src/pages/daily-owner-page.tsx`, `src/pages/daily-groups-page.tsx`, `src/pages/daily-shared-review-page.tsx`.
- Groups/feedback: `src/features/daily/groups/group-controls.tsx`, `src/features/daily/groups/feedback-panel.tsx`, `src/features/daily/groups/groups.css` (already untracked at entry, retained and refined).
- Presentation: `src/features/daily/ui/study-calendar.tsx`, `src/features/daily/ui/study-notebook.tsx`, `src/features/daily/ui/study-notebook.css`, new `src/features/daily/ui/study-section.ts`.
- History integration: `src/features/daily/hooks/use-daily.ts`, `src/features/daily/services/daily.service.ts`, `src/features/daily/lib/daily-contract.ts`, new `src/features/daily/lib/calendar-presentation.ts`.
- Checks: `tests/daily-study-ui.test.ts`, new `tests/daily-calendar-presentation.test.ts`, new `tests/daily-ux-browser-check.mjs`.
- Guidance/status: `apps/web/README.md` and this existing audit source.

Historical downstream flow: `/daily` previously opened saved history/today; the refinement above now opens today's editor, with saved history at `/daily?view=history`. Personal history depends on the existing `/daily/plans/dates` API change. Task-owned temporary Chromium and Vite runtimes were stopped after that verification. Real-backend/device verification remains the next integration checkpoint before broader release claims; no product decision blocked that scoped UI delivery. A third persisted task state remains a separate product/API/schema decision. No commit, push, merge, deployment, external effect or paid resource was performed.

### Daily/Group UI/UX improvement — accepted delivery (05/10/2026)

The friendly shared-study-notebook presentation, calendar-based navigation, section disclosures and group avatars increment is technically accepted for local use. Baseline: `45013bd202310e0e6bb0a95e1caf8d3969ca57d1`.

#### Delivered behavior
- **Navigation flow**: Personal Daily opens calendar week list -> seven-day list -> day detail. Group detail opens members -> each member's weeks -> days. Sections expand/collapse without unmounting drafts. Removed the prominent previous/next/current-week toolbar; historical date URLs and compact calendar chooser are retained.
- **Group avatar**: Migration V22 adds crop coordinates to `accountability_groups` and creates the `group_avatars` table (bytea raster storage up to 5 MiB, JPEG/PNG/WebP). API `/api/v1/groups/{groupId}/avatar` provides upload, crop reframing, delete (active founder only) and private authenticated byte reads (`no-store`, `nosniff`) for active group members. The frontend reuses the profile crop dialog/math and avatar image presentation with explicit preview/save/cancel.
- **Study notebook foundation**: `StudyAreaNav`, `StudyProgress`, `StudyIdentity`, `StudyEmpty` and `StudyDisclosure` establish shared typography, progress indicators, access-aware member identities and accessible disclosures.

#### Verification record
- `pnpm build` (`tsc -b && vite build`): 0 errors.
- `pnpm lint` (`oxlint`): 0 errors.
- Web unit/policy tests (`daily-study-ui.test.ts`, `daily-group-policy.test.ts`): 13/13 passed.
- Backend tests (`mvn test -Dtest=GroupMappingTest,DailyGroupMvpIntegrationTest`): 18/18 passed (V22 migration applied, Testcontainers PostgreSQL).
- Disposable HTTP/CDP browser checks:
  - `daily-group-http-browser-check.mjs`: 0 errors (avatar crop/save/reframing/deletion, member disclosure, review, feedback revalidation/recovery, leave and revocation).
  - `daily-evidence-http-browser-check.mjs`: 0 errors (file upload, link, retry, download original bytes, logout cleanup).
  - `daily-http-browser-check.mjs`: 0 errors (plan editor, submission timing, conflict retention, weekly reflection).


### Daily MVP — accepted local delivery (04/10/2026)

The personal Daily, evidence, accountability-group, shared-review and identified-feedback increment is technically accepted for local use. Original base: `d1dc0d5ea43ca0ebccfbe89cfccefd722da021f5`. Backend migrations V17–V21, authenticated API routes, Vietnamese web screens, persistence, current-access checks and original-byte revocation are delivered. No known implementation blocker remains for this bounded path. Local technical acceptance is not production-auth or deployment acceptance.

#### Usable paths and retained behavior

`/daily?date=YYYY-MM-DD` edits the owner's plan/tasks/reflection, uploads or links saved-task evidence and explicitly submits the plan. `/daily/week?weekStart=YYYY-MM-DD` reads aggregates and edits weekly reflection. `/daily/groups` creates groups, lists identified pending invitations and accepts or declines them. Group detail edits the member's own sharing and audience, invites by known username for the active founder, and leaves. A selected historical date opens a permitted member's day/week review, private evidence and named contributions; each contributor can create, edit or delete their own feedback.

Busy operations prevent draft replacement during editing. Failed transport/version conflicts retain typed drafts with explicit reload/retry. Dirty navigation requires confirmation. Cancelled or failed leave preserves sharing drafts; successful confirmed leave discards that draft and navigates without a second unsaved-draft prompt. Account-scoped queries and abort cleanup prevent cross-account reuse; access loss unmounts private content. Successful personal-plan mutations invalidate weekly aggregates.

#### Personal Daily contract

Daily plans belong to users, not groups: database uniqueness is owner/date and owner/week. The platform calendar is Asia/Ho_Chi_Minh (UTC+7), midnight day boundaries, Monday–Sunday weeks. The first explicit submission records one server timestamp across all groups; on-time means at or before the selected plan date's 07:30 cutoff. Edits/repeated submission do not reset it; late plans remain usable.

GET/PUT `/api/v1/daily/plans?date=YYYY-MM-DD`: 404 means no owned plan. PUT creates only with `expectedVersion=null`; updates require the matching version. Stale versions, duplicate creation and foreign task IDs return 409. Null task IDs create tasks; stable existing IDs remain; omitted tasks are removed. POST `/api/v1/daily/plans/{planId}/submit` records the first timestamp once; another owner/admin cannot submit it. GET/PUT `/api/v1/daily/weeks?weekStart=YYYY-MM-DD` normalizes Monday and version-guards reflection.

Task priorities MUST/SHOULD/COULD and delivered MVP statuses TODO/COMPLETED remain English wire enums with Vietnamese labels. IN_PROGRESS belongs to the broader design, not the current persisted wire contract. Rates are fractions, not percentages or weighted scores. Planned days include saved empty plans; missing days have no row. Weekly completion is the arithmetic mean over nonempty saved plans; MUST rate pools completed/total MUST tasks. Zero denominators are null/N/A. Recurring unfinished work/issues are owner-authored reflection, not generated analysis.

#### Group consent and current-access contract

Every actor comes from CurrentUserProvider and a current nondeleted ACTIVE account. Group membership alone grants no Daily access. New/reactivated membership starts sharing OFF/GROUP with old selections cleared. Nonowner reads require current ACTIVE owner/viewer accounts, current ACTIVE memberships in the named group, owner sharing ON and GROUP or current selected-viewer authorization. There is no founder/admin privacy bypass. Resource-parent/owner/path consistency is checked before projection or byte delivery.

Root `/api/v1/groups`: GET lists the actor's active groups; POST `{name}` creates a group and founder membership. Summary is `{id,name,ownerId}`. GET `/{groupId}` returns `{id,name,ownerId,members,mySharing}` to active members, without email. PUT `/{groupId}/sharing` atomically replaces own `{shareDaily,sharingMode,selectedViewerIds}`; selected viewers must be other active members, validated even while OFF. POST `/{groupId}/leave` returns 204, clears own sharing/membership and incoming/outgoing selections.

The active founder POSTs `/{groupId}/invitations` with `{username}` targeting an existing ACTIVE account. GET `/groups/invitations` lists the actor's pending invitations. POST `/groups/invitations/{invitationId}/accept` grants membership only to that identified target; `/decline` returns 204. Pending invitations grant no access; pending group/target pairs are unique. Mutations serialize on the group row and refresh invitation status after locking. Terminal acceptance never reactivates a departed member; rejoin needs a new invitation. No open directory/join, founder transfer or outbound notification is included.

Private JSON/errors/bytes use no-store. Committed OFF/deselection/leave/account changes deny subsequent historical and current reads, including old saved metadata/byte IDs. Already downloaded bytes, rendered content and external-link destinations cannot be remotely recalled. In-flight overlap is not claimed cancelled or linearly excluded.

#### Evidence contract

Root `/api/v1/daily/plans/{planId}/tasks/{taskId}/evidence`: GET returns a metadata array; POST multipart `file` plus `stage=START|FINISH` creates FILE; POST `/links` with `{stage,url,label}` creates LINK. Both POSTs return 201 with one complete persisted metadata record, not an envelope/array/empty body. GET `/{evidenceId}/bytes` downloads original FILE bytes; DELETE `/{evidenceId}` returns 204. Mutations are owner-only; nonowner reads supply `groupId` and pass current group/resource authorization.

Metadata: `{id,planId,taskId,stage,kind,originalName,contentType,sizeBytes,url,label,createdAt}`; irrelevant fields are null, including LINK sizeBytes. FILE stores immutable PostgreSQL bytea, nonempty and at most 5 MiB, with at most 10 evidence items per task total. Filename is bounded/sanitized; MIME is untrusted, and delivery is attachment/octet-stream with nosniff, never inline HTML/SVG. LINK permits bounded absolute HTTP(S) URLs without credentials (at most 2048 characters) and nonblank labels (at most 200). External links are not fetched/prefetched; the UI explains their independent access policy and uses noreferrer.

Unsaved tasks must be saved first. Failure retains file/link input and never claims persistence. Evidence mutations lock the saved parent consistently with task deletion, enforce concurrent limits, and never change plan version/reflection/firstSubmittedAt. Task deletion cascades evidence. Returned identity/stage/kind is checked before treating an upload as saved. The shared EvidencePanel downloads only through the authenticated original-byte route, without public embeds.

#### Shared Daily and identified feedback

GET `/api/v1/groups/{groupId}/daily?date=` returns `{groupId,date,members:[{userId,displayName,access,summary}]}`. NOT_SHARED has an explicit null summary and does not query/reveal private plan existence or counts. An allowed missing plan also has null summary. Permitted summary is `{planId,firstSubmittedAt,onTime,completedCount,totalCount,mustCompleted,mustTotal}`. GET `/groups/{groupId}/daily/{ownerId}/plans?date=` and `/weeks?weekStart=` return the unchanged owner shapes through current access checks.

Feedback roots are `/groups/{groupId}/daily/{ownerId}/plans/{planId}/feedback` and `/weeks/{reviewId}/feedback`. GET returns `{contributions,contributorCount}`; contribution fields are `{id,authorId,authorDisplayName,text,createdAt,updatedAt,version}`. PUT own `{text,expectedVersion}` creates only with null expectedVersion or updates the matching version. DELETE own contribution with expectedVersion returns 204. Text is trimmed, nonblank, at most 4000 characters, multiline and flexible; one unique contribution per group/review/author, with no anonymous input, paired-field requirement, threads or append stream.

The author must be a different current authorized active member; author identity is never supplied by the request. Saved plan/weekly-review IDs and group/owner/review consistency are checked. Only contributors with current access remain visible, including their identities/text/count; different group audiences cannot leak each other's feedback. Feedback does not mutate personal plans or generate reviews.

#### Daily/Group mapping refactor — ACCEPTED

Eight service implementations were audited; structural mapping was extracted from five: DailyServiceImpl, SharedDailyServiceImpl, EvidenceServiceImpl, DailyFeedbackServiceImpl and GroupServiceImpl. Module-local Spring MapStruct DailyMapper, SharedDailyMapper, EvidenceMapper, DailyFeedbackMapper and GroupMapper construct task/plan/week, shared summary/member/dashboard, evidence metadata/cloned-download, feedback and group summary/member/detail/sharing/invitation projections.

Business calculations, on-time policy, weekly rates/rounding/deduplication, authorization, audience/account filtering, sorting, validation, transactions/locks, persistence and repository resolution remain in services. Input-preparation helpers deliberately remain where they calculate or resolve values. SharedDailyAccessImpl, GroupDailyAccessImpl and GroupMembershipServiceImpl contain authorization or domain creation/default-consent responsibilities, not response mapping, and remain unchanged. API fields, null handling, ordering and private-field exposure are preserved. Existing integration tests/harness received only required mapper registrations; existing assertions were retained.

Exact sixteen-path refactor manifest digest: `b78bb1d8109aa61798881429d7d2efdfd27ff670a3fa8b353941d92f0a6b5f8f`. Pre-refactor manifest digest: `a95b02037127ae120915944111dda36ff313e17d1ca5f0e833ae76f34c07b01b`. Source/generated-mapping inspection, regression tests, hash checks and comparison against the original source establish technical acceptance; unrelated application bytes were preserved.

```text
888a2b4fb29bf412c5d71547c61e6862ebcdc085de6d65817604b613d61c36f1  apps/api/src/main/java/me/nghlong3004/olympic/daily/evidence/mapper/EvidenceMapper.java
c5d7b3b6d7f6531c01c0382a92974e1cdd36a232f762fbb6d552d36722130707  apps/api/src/main/java/me/nghlong3004/olympic/daily/evidence/service/impl/EvidenceServiceImpl.java
bd024dd37d7f98e2c77555be169f5ec0340ec3631a873c4d7504a1c67d884bbe  apps/api/src/main/java/me/nghlong3004/olympic/daily/feedback/mapper/DailyFeedbackMapper.java
3afb1dd4f1450790dcb6eec877643a467ef8bcc4a63d686a56b1bf8657b4192b  apps/api/src/main/java/me/nghlong3004/olympic/daily/feedback/service/impl/DailyFeedbackServiceImpl.java
91ea209a35f60330f3a24c0eb716f2206670db8d66120d9d250553b78e81eea7  apps/api/src/main/java/me/nghlong3004/olympic/daily/mapper/DailyMapper.java
cfae993d33e28964f8c8a63b75291f57c10905eba0974c304ea1425ddcd021af  apps/api/src/main/java/me/nghlong3004/olympic/daily/service/impl/DailyServiceImpl.java
1272d9d833a6bf49bc547a580f98cce290bc4484d4156260d34ca699a08fc77f  apps/api/src/main/java/me/nghlong3004/olympic/daily/sharing/mapper/SharedDailyMapper.java
5304af84d43916aab44df16ac53c00ee2bd32794c2946c221fd6f663a9fd2935  apps/api/src/main/java/me/nghlong3004/olympic/daily/sharing/service/impl/SharedDailyServiceImpl.java
f1eebec5848a6d2761eb21c99192a45e8b7730d11d3441dc54c4700889cf97fb  apps/api/src/main/java/me/nghlong3004/olympic/group/mapper/GroupMapper.java
ce423bfe52e8b1eceab481d8ce7ab12472a406fb777d97244ccb1a276259e249  apps/api/src/main/java/me/nghlong3004/olympic/group/service/impl/GroupServiceImpl.java
d665ffdb9f9a0deeedcceb0f90eb6ce2c8c25da315142b558a895bbac351ce85  apps/api/src/test/java/me/nghlong3004/olympic/authoring/AuthoringBrowserHarness.java
a474b6283904a1ad96f72e31f23dcd6026113279a1567b438614865fb3ec14b5  apps/api/src/test/java/me/nghlong3004/olympic/daily/DailyIntegrationTest.java
fe674f16b7d4efdb034a2ce82e93f4e22ec12dd0972282dd9f8684b3db928621  apps/api/src/test/java/me/nghlong3004/olympic/daily/evidence/EvidenceIntegrationTest.java
78b098ec286f32db40a8c405e6d16e40449706c83c7f4a5faf634014853fb682  apps/api/src/test/java/me/nghlong3004/olympic/daily/mapper/DailyMappingTest.java
3bedf36edaa7e2fbb835e81a1eb2d564cc655e2287c8c059c3b4d5aef0ac8657  apps/api/src/test/java/me/nghlong3004/olympic/daily/sharing/DailyGroupMvpIntegrationTest.java
18070825842b3c7ce1f0e977c860c6ac69892fafdd29b364b3a5b09031f42690  apps/api/src/test/java/me/nghlong3004/olympic/group/mapper/GroupMappingTest.java
```

#### Verification evidence and limits

Verification used Java 25.0.3, Docker 29.6.1 and disposable PostgreSQL 16.15 with Flyway V1–V21. Completed refactor checks:

| Suite | Passed |
| --- | --- |
| DailyMappingTest | 10 |
| GroupMappingTest | 5 |
| DailyCalendarTest | 3 |
| DailyIntegrationTest | 7 |
| DailyGroupMvpIntegrationTest | 12 |
| EvidenceIntegrationTest | 7 |
| EvidenceControllerTest | 6 |
| GroupDailyAccessIntegrationTest | 4 |
| GroupDailyAccessTest | 7 |
| AuthoringBrowserHarness (separate HTTP smoke run) | 1 |

The focused run completed BUILD SUCCESS with 61 tests; the separate bounded real HTTP fixture run completed BUILD SUCCESS with one test. Total 62, zero failures/errors/skips. Existing test assertions cover persistence, owner/shared shape parity, consent, historical access/revocation, contributor filtering, evidence and concurrent/version behavior. Mapping tests additionally cover every projected field, nullable reviews/rates/file-link fields, name fallback, caller-selected ordering, explicit-null NOT_SHARED JSON and defensive byte copying. Reports are under `apps/api/target/surefire-reports/`. Exact source hashes and whitespace checks passed.

Before the mapping-only refactor, the complete MVP verification passed 47 API tests, 29 focused Node owner/auth/evidence/group policy tests, pnpm build and lint, and a real browser-to-HTTP/security/controllers/services/PostgreSQL flow with 51 recorded checks and no recorded browser errors. All recorded group responses were no-store. Final browser artifact: `/tmp/daily-group-http-1791118548384/results.json`, SHA256 `402bbf3866f37ebfbbfb7d45ba877123af6ade726d27f9c02ae23a0a11f6898e`.

That browser flow verified owner save/upload/file+link, invitation accept/decline/forgery/default-OFF, selected historical dashboards/day/week reads, exact-byte attachment download, identified contributions, failed PUT draft retention, concurrent 409/reload/edit, own delete/recreate and weekly feedback. OFF, deselection, viewer leave and owner leave denied subsequent historical reviews/feedback/metadata/byte requests. Contributor access loss removed text/identity/count; recipients could not write own feedback; rejoin required a fresh invitation and stayed OFF; terminal replay did not re-grant membership; personal plan JSON stayed identical. Dirty-leave cancel preserved draft/membership and confirmed leave navigated. Desktop/mobile light/dark captures were inspected; keyboard focus, overflow and reduced-motion checks passed.

Earlier failed/partial compile, fixture-startup and browser checks remain distinct from successful reruns; only corrected-source completed runs establish the results above. Prior SQL transaction and TypeScript inference issues, cached invitation status and dirty-leave navigation were repaired before final MVP acceptance. No failed or unknown result is counted as a pass.

Limits: production cryptographically signed JWT issuance/refresh/server logout is unverified; fixture authentication is not proof of that lifecycle. The full repository suite and fresh browser UI checks were not rerun for the backend-only mapping refactor, and no new verification campaign accompanies this commit. Existing compiler/runtime warnings concern Lombok Unsafe, unchecked code, Mockito dynamic agents and deprecated Jackson test configuration, not test failures. No production/live-data/deployment acceptance, outbound notifications, generated reviews, leaderboard or remote erasure is claimed.

Reproduce focused API checks from `apps/api` with Java 25 and Docker available:

```sh
./mvnw -Dlogging.level.org.hibernate.SQL=OFF -Dtest=DailyMappingTest,GroupMappingTest,DailyCalendarTest,DailyIntegrationTest,DailyGroupMvpIntegrationTest,EvidenceIntegrationTest,EvidenceControllerTest,GroupDailyAccessIntegrationTest,GroupDailyAccessTest test
AUTHORING_BROWSER=true ./mvnw -Dlogging.level.org.hibernate.SQL=OFF -Dtest=AuthoringBrowserHarness -Dauthoring.browser.port=0 -Dauthoring.browser.seconds=1 test
```

Commit scope is the full local project increment together: backend foundations and mappers, migrations, web, tests, HTTP harness and this project-facing acceptance summary. Push, merge and deployment are outside this local commit.

Local handoff checkpoint — 04/10/2026: Harness21089 completed exit0 BUILD SUCCESS at07:21:10UTC, 1test/0failures/0errors/0skips; suite936.057s, bounded hold900.584s. Durable AuthoringBrowserHarness Surefire XML confirms readiness and completed hold; no restart or session termination. Both bounded browser paths below remain ACCEPTED with their stated limits. Lead ACCEPTED the three AGENTS.md guide additions at base cac1b83912be7cf12eda538807cbe148ae72aa61 with verified module, draft-edit, figure-limit, immutable-row and route corrections; documentation scope closed, mandatory instructions/references preserved. Local commit covers the accepted question/exam increment, accepted mapper maintenance, source tests/browser scenarios and these guides only; generated evidence/private/operator material excluded. Daily remains queued for Human decisions below. A universal09:00 cutoff is not recommended: it measures morning availability rather than a person's planning commitment. Personal deadline, calendar, formulas, recurring identity and minimal feedback proposals require confirmation before affected implementation.

Explicit end-to-end acceptance — 04/10/2026,07:12UTC: Lead ACCEPT manual question author/save/reopen path and prepared exam assemble/preview/publish/scheduled student read path in the disposable local Chromium → real HTTP/security/controllers/services → PostgreSQL16/Flyway16 environment. These are usable browser results, not compile-only acceptance. No known blocker remains on these two bounded paths. Existing owners/drafts/sessions preserved; no push/deployment/live-data/external service changes.

Question closure evidence: browser54190 /tmp/authoring-http-1791097572155/results.json and question-0..3.json prove all4 UI-authored forms save, fresh page/login/server reopen and publication;18 text blocks retain exact authored newline/two spaces. Browser76184 /tmp/authoring-http-1791097625297/results.json + question-figures.json proves UI duplicate routing, separate valid PNG stem/solution uploads, saved/fresh-reopened BOTH rendered images, concurrent409 retaining title and figures, explicit server reload, student source bytes403. Browser81935 /tmp/authoring-http-1791097802401/results.json proves filtered list return/Back/Forward, delayed REAL GET (response held, not mocked) keeps dirty edit/conflict, pristine handoff adopts newer server, history handoffs consumed. Earlier source/model/lifecycle evidence stays bounded and supplemental. Runner selector errors (anchor versus button; existing draft requires explicit edit) were corrected, not product regressions.

Exam closure evidence: browser54190 proves4 published-bank placements, persisted order/2-point placements/stable multipart weights1+1, plain/solution preview, real return link, clean reopened controls, UI publication/student HTTP solution-free read. Browser81935 proves dirty publish disabled, bank Enter does not save, real409 retains title/multipart controls, explicit reload returns clean publish eligibility. JOINED browser97145 /tmp/authoring-http-1791097850203/results.json + student-paper.json + student.png proves a private-figure question assembled/saved/plain-and-solution-previewed/published THROUGH UI, future paper404/stem bytes404/student browser denial, then released student browser renders valid PNG, HTTP solutions=true still omits answer/explanation, stem bytes200/equal uploaded PNG, solution-only bytes404. Anonymous paper401 checked after release. Separate earlier browser1031 /tmp/authoring-http-1791097716757 passed same scheduled privacy with HTTP setup; joined proof supersedes that setup limit. Accepted PostgreSQL/security suites supplement immutable v1/v2/weights/disabled-deleted/read boundaries. Tests7/7, build32972 exit0, final lint68957 exit0 baseline warnings, diffcheck0.

Remaining limits/next frontier: fixed fixture login/decoder is NOT production signed-JWT/login/refresh proof; fresh page uses explicit real fixture login UI. No deployed/external-storage/mail/Redis acceptance, no attempts/submissions/grading/student solution access. PNG fixture is1x1 render/byte transport/privacy proof, not large-image visual quality or pixel-validation proof. Prior frozen-clock scheduled failure remains historical; test-only moving Clock.systemUTC correction now supported by successful release transition. Harness21089 readiness accepted at07:06:06UTC; bounded900s hold still active at acceptance, not reported completed. Lead owns collecting its final disposition without restarting/terminating sessions. Daily current-path dependency is RESOLVED, implementation remains QUEUED pending Human timezone/calendar/week, on-time cutoff, weekly denominator/Must, recurring issues and minimum Group Feedback choices from the existing brief below; no invented choices or Daily writes/dispatch.

Next runtime prepared — 04/10/2026: Lead ACCEPT/applied exact harness Clock.systemUTC bean correction (test-only; production unchanged), owner37483e51 closed. Browser script now consumes returned IDs through AUTHORING_INPUT rather than expired fixture IDs, includes question list/back/forward, delayed REAL GET response with pristine/dirty handoff checks, exam409/dirty-publish/multipart retention and bank-search Enter isolation. Syntax0; normal, figures, navigation and scheduled privacy modes ready before next bounded fixture. Lead starts same900s loopback18080 harness only now; next result checkpoint startup then these modes immediately, estimated10–15min after readiness unless named defect. No full-path closure or Daily start.

Live repair disposition — 04/10/2026: Lead ACCEPT exam hydration repair after focused Node7/7, build32972 exit0 (TypeScript/Vite), lint52651 exit0 (baseline plus browser-script warning), diffcheck0. Hydration aligns CURRENT row without dirty mutation; user updates compose functionally. Exact patch mechanically corrected title replacement and effect-test boundary. Browser40713 saved-exam resume passed plain/solution preview, UI publication paper a6b499ff, student HTTP no answer/explanation keys; durable /tmp/authoring-http-1791097038473/results.json. Editor owner101a3d5d closed unless named regression. This supersedes prior hydration failure, not whole-path acceptance.

Question figures/conflict evidence — 04/10/2026: browser87713 passed UI duplicate, distinct stem/solution PNG upload/save/fresh-login reopen with rendered image, real concurrent-update conflict retaining local title/figure controls, explicit reload adopting server title, student source bytes403. Durable /tmp/authoring-http-1791096935617/results.json and question-figures.json. Earlier runner7027 wrongly expected viewer after existing-draft save; persisted figures were sound, runner corrected. All4 normal forms save/reopen/publication evidence remains accepted bounded. Back/filter/history and delayed-handoff dirty/pristine browser cases still open.

Scheduled scenario actual disposition — 04/10/2026: browser80928 durable /tmp/authoring-http-1791097082216/results.json proves future student paper404, stem bytes404, browser denial. After-release timeout diagnosed: AuthoringBrowserHarness FixtureClock holds a final startup Instant; wall-clock wait cannot advance injected Clock. No production scheduling defect inferred. Earlier fixture draft failed publication appropriately for missing alt; alt supplied through UI before successful publication. Harness22741 completed exit0 BUILD SUCCESS1test0failure/error/skip,984.5s test, finished07:00:36UTC; no blind runtime restart. Grok37483e51 reopens only harness Clock bean correction, then Lead owns prepared scenario execution (released student rendered stem/no solution keys or solution-only bytes, navigation/conflict). Both whole paths remain OPEN; Daily stays queued. Sessions/owners/drafts preserved, fixture bearer remains non-cryptographic login proof.

Browser narrowing evidence — 04/10/2026: live GET saved exam ece6924f returns200/version0 with both multipart stable-part-id weights1+1=2 and correct ordered placements; no persisted weight loss. Reopened UI lacks controls/marks dirty, bounded UI hydration regression only. Four captured question JSON documents retain authored newline/two-space source content. These checks strengthen partial persistence proof, not missing figure/conflict/student-browser full-path acceptance.

Browser follow-through — 04/10/2026: prior second-form timeout cannot establish product cause because old runner captured no final page/API document. New deterministic evidence shows fixture reload without refresh ends at session-error guard; runner now waits for settled state, navigates login UI, then reopens without handoff. Another false runner failure required editor input after successful save switched to viewer; fixed saved-UUID wait. Active harness22741 readiness passed, Vite25486 preserved. Actual browser98106 now demonstrates all4 question forms save/HTTP title/readiness/relogin/reopen and publication, durable /tmp/authoring-http-1791096462466/results.json + question JSON + failure.png. Still not full question acceptance: figures/source exactness/conflict/navigation cases pending. Exam assembly/save/plain+solution preview reached; return editor disabled publish dirty and lost multipart controls. Existing Grok101a3d5d reopened bounded exam editor hydration/sibling-state correction, preserve dirty guard/user drafts; next finish exact repair then Lead same-runtime rerun. Exam publication/student browser/privacy still open; Daily queued. No new routine review layer.

Real browser execution — 04/10/2026: Lead started Vite25486 at localhost3000 against bounded disposable harness89050 loopback18080; readiness passed. Added repeatable tests/authoring-http-browser-check.mjs. First attempt premature login before readiness failed; second full navigation lost memory-only bearer (fixture has no refresh), runner corrected to SPA navigation and explicit fixture bearer after reload, not production auth proof. Actual third run32903 reached question saves/reloads, then failed reopen-title wait for form1; durable /tmp/authoring-http-1791095222768/results.json retains completed checks and failure. No full-path acceptance. Lead owns immediate diagnosis of persisted row versus reload/auth/render state, then completes four-form/private-figure and exam browser/privacy scenarios. Existing owners/drafts preserved; Daily queued. Delay was Lead browser execution/coordination gap plus repaired startup defects, not need for more routine review layers.

Harness actual readiness disposition — 04/10/2026: inspected existing runner8606, exits0 BUILD SUCCESS after16:09; durable AuthoringBrowserHarness report1test0failure0error0skip (929.7s). XML line167 records fixture ready, all unchanged startup probes passed on loopback18080/disposable PostgreSQL/Flyway16, then bounded900s hold completed. Lead ACCEPT harness startup/readiness only. No browser checks/save/reopen evidence ran in this window; elapsed window was not a startup failure. Next owned checkpoint is Lead preparing executable browser scenarios against current routed UI (four question forms/save/reopen/private figures and exam assembly/publication/student privacy), checking Vite/browser environment, then restarting bounded fixture only when scenarios are ready to execute immediately. No blind repeat hold, no Peer scope reopening, no draft/session removal. Fixture login/decoder is not normal login/JWT crypto proof. Question/exam full-path and Daily closure remain open.

Question search repair accepted — 04/10/2026: final non-concatenating repository/test candidate applied with mechanical missing Page import. Runner55316 BUILD SUCCESS1test0failure0error0skip, disposable PostgreSQL16/Flyway16; null lecturer/admin, matching/absent fragments and visibility pass, generated cast(? as varchar) confirmed; diffcheck0. Lead ACCEPT bounded repair, owner37483e51 closes unless named regression. Unchanged loopback18080/900s harness restarted; Lead owns immediate readiness outcome, then browser/API proof. No full-path acceptance; drafts preserved.

Question search repair decision — 04/10/2026: Lead ACCEPT runtime diagnosis: Hibernate null search within concat/lower binds bytea; PostgreSQL type-checks both sides despite null guard. Authorize bounded explicit cast(:search as string) in QuestionRepository only plus NEW QuestionSearchBindingIntegrationTest on disposable PostgreSQL. Grok37483e51 owns exact patch preparation, no runners/writes; return event repository/null lecturer/admin and present/absent search regression candidate. Lead applies/runs focused proof, then unchanged omitted-search harness probe. No harness bypass. Similar HonorRepository shape deferred outside this repair. Routes compile accepted; runtime readiness and browser/API/full-path acceptance remain open; drafts preserved.

Exam route compile disposition — 04/10/2026: post-route build81440 exits0 TypeScript/Vite (existing large-chunk warning). Lead ACCEPT guarded route integration at compile scope; exam writer closed unless named regression. Browser/privacy/API acceptance remains open; harness readiness failed on production lower(bytea) query and read-only diagnosis is independently owned by37483e51. No active Maven/web build runners at this checkpoint; drafts preserved.

Exam/runtime latest — 04/10/2026: Lead ACCEPT latest exam import/null-version repair as compile integration input; focused Node6/6, build49588 exits0 TypeScript/Vite, prior lint0 baseline warnings. Lead wired guarded lecturer/admin draft/new/preview/paper routes and student /exams released-paper routes; post-route build running. No browser/full-path acceptance. Harness rerun39877 exits1, 1test/1error/0skip: seed passes, lecturer question-list probe500, PostgreSQL lower(bytea) error. Readiness/hold never reached. Owner37483e51 read-only diagnosis/minimal fix proposal for production null-search query; cannot bypass probe or edit production yet. Next checkpoints: post-route build disposition; exact query diagnosis/repair then successful runtime probes and browser/API persistence/privacy evidence. Drafts/scopes preserved.

Harness seed repair — 04/10/2026: Lead ACCEPT exact one-line role placeholder cast to user_role as integration input and applied it; remaining seed schema checked by owner. Bounded loopback18080/900s rerun started, Lead owns runner/readiness checkpoint. Prior startup error remains historical; rerun readiness and browser/API acceptance not yet established. No production changes; exam compile/Node repairs remain independent owner101a3d5d scope.

Exam build result — 04/10/2026: build27593 exits2: exam-editor.tsx73 nullable form.version passed to publish; exam-item-view.tsx1 imports usePrivateFigureResolver from module without that export. Owner101a3d5d now has these exact exam-only compile repairs alongside Node module-load correction. Applied candidate remains unaccepted for compile/full path; no rollback/draft removal. Lead route integration returns after corrected artifact/build checkpoint.

Runtime/UI checkpoint — 04/10/2026: actual harness runner17579 exited1 after42.308s, 1 test/0failures/1error/0skip, not hold expiry. Disposable PostgreSQL/Flyway16 started; users seed failed because role varchar lacks user_role cast. Readiness never completed, hold/browser checks never began; durable AuthoringBrowserHarness surefire report. Owner37483e51 reopens only bounded seed/schema correction; next event exact repair then Lead runtime rerun/readiness disposition. Independently Lead ACCEPT dirty-publish/search-isolation correction as integration input and applied full exam UI plus delta. Prescribed focused Node checks fail3 module loads (alias/extensionless imports), pass2; owner101a3d5d returns bounded Node-compatible repair. Lint0 baseline warnings; build27593 in progress. Routes remain Lead-owned pending checked UI; no browser/API/full-path acceptance. Drafts/sessions preserved.

HTTP harness correction — 04/10/2026: Lead ACCEPT explicit Configuration(proxyBeanMethods=false) + TestComponent correction as integration input; combined new AuthoringBrowserHarness applied. Maven test-compile runner27574 exits0 BUILD SUCCESS. Sole TestConfiguration would merge production Boot root, so explicit non-Boot configuration retained. Lead starts opt-in disposable harness on loopback18080 for900 seconds; startup readiness still unverified, no browser/API acceptance. No production/POM/config edits; fixed login/decoder remains fixture-only. Exam UI corrected delta is ready for separate Lead inspection/integration.

HTTP harness disposition — 04/10/2026: Lead REJECT unapplied one-file AuthoringBrowserHarness revision for nested @SpringBootConfiguration creating another discoverable Boot root in the normal test classpath; environment-disabled execution does not isolate discovery. Grok37483e51 retains new AuthoringBrowser test-only scope; return event is exact explicit test-configuration correction, then Lead applies/compiles and starts bounded disposable loopback/PostgreSQL runtime. No server/Maven started yet. Fixed fixture decoder/login is not production login or JWT crypto proof; browser save/reopen/private-byte acceptance remains pending. Exam UI correction proceeds independently; all drafts preserved.

Exam UI disposition — 04/10/2026: Lead REJECT saved complete candidate examUIPatches[1] (base cac1b839), unapplied: exam-editor.tsx nests bank search form inside save form, and allows dirty local edits to publish only the older persisted version. Grok101a3d5d owns bounded correction in existing exams/new exam pages/tests scope; return event: corrected deterministic patch plus search-isolation/save-before-publish regression evidence. Lead then inspects/applies, runs tests/build/lint and wires guarded routes, independently of HTTP harness. Candidate and drafts preserved; question compile acceptance unchanged. Next usable outcome: routed staff assembly/save/preview/publication and released student read UI. Missing smallest working path evidence: corrected integrated UI, browser regressions and disposable real HTTP/PostgreSQL save/reopen/privacy proof. Compile is not full-path acceptance. Harness37483e51 retains separate new AuthoringBrowser test scope; Daily stays queued.

Question compile repair disposition — 04/10/2026: Lead ACCEPT exact two-line repair as integration input after build60738 exits0 (TypeScript/Vite), diffcheck0, prior corrected-workspace lint0 baseline warnings. TS2339 resolved; delayed-arrival dirty guard, duplicate route and history consumption remain on disk. This is not browser acceptance or real HTTP/PostgreSQL save/reopen evidence. Exam UI full candidate inspection and test HTTP harness are separate active frontiers; no full-path closure/Daily start.

Question TypeScript repair — 04/10/2026: exact two-line boolean/explicit-nonnull correction inspected/applied, preserving delayed-arrival draft guard. Lead reruns web build; no browser/API acceptance claim. Earlier TS2339 failure remains historical until actual runner disposition. Existing owner/drafts unchanged.

Question correction check failure — 04/10/2026: build51696 fails TS2339 at manual-question-form.tsx86. newerServer type predicate is unsound: false includes valid older Question, but TypeScript narrows subsequent branch to never. Lead REJECT applied candidate pending bounded boolean/explicit-nonnull repair from same writer; lint exits0 baseline warnings. No rollback/draft removal. Browser/API evidence remains pending; unrelated exam UI/HTTP fixture scopes continue.

Question correction ready checkpoint — 04/10/2026: revised one-file workspace patch inspected/applied. Delayed higher-version server arrival adopts only unchanged seed, otherwise retains edited draft/figures and exposes conflict/reload-discard; duplicate navigates returned copy id without corrupting original status/version; history handoff removed while current mount keeps local draft. Lead build/lint running; NOT ACCEPTED until browser regressions and real HTTP/PostgreSQL save/reopen. Complete exam UI artifact retrieved/stored, not applied or accepted; exact candidate inspection next independent frontier. HTTP harness owner continues separate test-only scope. No owner/draft/external-boundary changes.

Question workspace correction disposition — 04/10/2026: Lead inspected complete one-file patch, REJECT before application for asynchronous data loss: delayed newer-server arrival unconditionally applyServer replaces live handoff draft after user editing/upload. Separate duplicate navigation and history consumption are appropriate; writer retains correction scope to guard delayed arrival (pristine seed may adopt newer server, changed draft stays with explicit conflict/reload-discard control). Initial higher-version server selection is distinct from delayed refetch. No new dependencies/search gate; complete corrected patch/browser regression is next return. Existing on-disk form/pages/build evidence and all drafts preserved; real API/browser proof remains open.

Multipart/v2 disposition — 04/10/2026: Lead ACCEPT exact applied test-only candidate after runner53756 BUILD SUCCESS, ExamVerticalIntegrationTest13 tests, zero failures/errors/skips, disposable PostgreSQL16/Flyway16. Proof covers stable-part-id persisted weights, content.parts array order, and publication v2 preserving v1 JSON/private bytes while taking edited source/weights. Durable report: apps/api/target/surefire-reports/me.nghlong3004.olympic.exam.ExamVerticalIntegrationTest.txt. Shared Maven target released; no production change. This closes the ready backend evidence handoff, not whole question/exam paths. Question duplicate/history-state correction and real browser/API save/reopen, exam UI/browser integration, and disposable HTTP fixture remain independent owned frontiers. Daily remains queued; drafts preserved/no external effects.

Multipart/v2 ready-step recovery — 04/10/2026: no technical or authority blocker prevented this handoff; permission-response turns displaced Lead integration. Lead inspected and applied the exact test-only multipart/v2 candidate to ExamVerticalIntegrationTest; runner53756 now runs the PostgreSQL suite, shared Maven target exclusively held. Next return checkpoint: actual suite counts/exit plus explicit ACCEPT/REJECT of stable-part-id weight/parts-order and v1 JSON/private-byte survival across v2 publication evidence. Direct modified figure bytes are a DB fixture, not a raster-upload validity claim. Prior accepted lifecycle/security evidence stays bounded; question workspace correction, exam web and test HTTP harness retain independent owners/drafts. Daily remains queued until both whole user paths are explicitly accepted.

Web checkpoint result — 04/10/2026: build46280 exits0 (TypeScript + Vite), manual model11 tests pass, lint exits0 with existing Fast Refresh/hook warnings; diffcheck0. Historical redundant-tag TS1382 integration failure fixed. These are candidate checks, not browser/API save/reopen acceptance. Question workspace duplicate/handoff corrections remain writer-owned; exam screens and disposable HTTP fixture remain their separate ready scopes. No Maven/web build runner active at this checkpoint. Lead retains consequential exact-candidate review and end-to-end acceptance.

Mapper audit disposition by module — all based on cac1b839: recognition adds AchievementMappingSource/RecognitionMapper and updates service plus mapper/integration tests: honor/participant/achievement/ranking/profile/file/download structural mapping only; privilege masking, points, file queries/URL selection/auth/transactions remain service-owned, byte/list identities verified. Studyroom adds StudyRoomMapper and mapper tests, updates service and integration wiring: summary/playback/member/track/snapshot structural mapping only; display names/avatar URIs/crops/lease/presence/focus/timeline/Me/counts/request policy/auth remain service-owned. Admin adds AdminUserMapper and mapper tests, removes AdminUserResponse factory and wires administration service; eleven search fields copied with same permission set/crop/null handling. User reuses existing FileMapper for six avatar-upload fields with null guard, updates service/test; validation/deletion/crop/download URI remain service-owned. Auth/document/post/topic/storage/assessment intentionally unchanged: already mapped or conversions issue credentials, enrich URLs, set slug/status/publication policy, query aggregates or persist import workflow. No blanket mapper proliferation or importer edits. Verification limits: focused suites and disposable PostgreSQL, not deployed/external-service behavior; reports in apps/api/target/surefire-reports. Maintenance acceptance does not close question/exam product paths.

Ready verification support — 04/10/2026: closed stable-module maintenance owner37483e51 now exclusively prepares NEW test-only authoring/AuthoringBrowser* HTTP fixture files for Lead browser-to-real-controller/PostgreSQL save/reopen evidence. No production/POM/shared config/web or existing question/exam test writes. Disposable database/private byte storage and existing real security chain; test-token decoding must be disclosed, not normal login proof. No existing dev/live DB, Redis/importer/Cloudinary/mail external runtime. Lead coordinates shared Maven and browser, verifies exact fixture before starting bounded opt-in local server. This supports the existing promised path, not Daily or scope expansion.

Superseding runtime disposition — 04/10/2026: Lead ACCEPT corrected Recognition mapper after runner82191 BUILD SUCCESS42 tests, zero failures/errors/skips (Recognition mapper4/controller8/PostgreSQL integration16; Exam PostgreSQL12/security-chain2). Generated mapper inspected: evidence bytes and supplied lists retain identity; participant null failures/unmodifiable list behavior preserved; privilege masking remains in service. All three maintenance candidates now accepted within their audited scope; no dependency/schema/API/privacy changes. Lead ACCEPT new exam security/student-denial evidence separately from the prior lifecycle suite; no whole-path closure. Backend owner continues multipart stable-id weights and publish-v2/v1-survival proof. Studyroom assignment closed; same Grok101a3d5d now exclusively owns exam web feature/new exam pages/tests, shared routes/nav Lead-owned, question writer separate. Accepted backend/contracts are ready inputs. Question model11 tests pass/lint exits0; first build failed a redundant integration closing tag, exact tag fixed and build46280 pending. Local normal API on8080 is not running (health check connection refused), so real browser/API persistence proof still needs a disposable local test runtime, not live data. Daily implementation remains queued.

Recovery checkpoint — 04/10/2026: runner39823 recovered with BUILD SUCCESS, 37 tests, zero failures/errors/skips. Lead ACCEPT corrected studyroom mapper (mapper2/controller5/rules4/PostgreSQL integration16) and admin/avatar six-file candidate (mapper5/avatar5). Structural conversions reuse established mapper conventions; service authorization/policy/URI/transactions stay unchanged, permission/list identity and null/crop failures preserved. Durable reports are under apps/api/target/surefire-reports. Recognition byte/list/null correction and integration wiring applied (duplicate abstract participant declaration mechanically removed); NOT ACCEPTED until runner82191 returns. Same coordinated Maven runner checks ExamSecurityChainTest plus disabled/deleted student reads and prior PostgreSQL lifecycle tests; prior eleven-test acceptance remains bounded, not product closure. Question D/E complete candidate applied including bank/detail wiring (missing unchanged bank closing-tag patch context repaired); NOT ACCEPTED. Writer owns separate duplicate-navigation and history-state handoff consumption corrections, then Lead verifies browser/API save/reopen. Pending local figures must not be mistaken for server persistence on reload. Exam web assembly/preview/paper path and multipart/v2 persistence evidence still remain. Current owners/drafts preserved; Daily stays queued until explicit acceptance of both complete paths. No push/deploy/external effects/costs.

Additional authorized mapper maintenance — 04/10/2026: parallel bounded audit/refactors do not replace/delay current question/exam paths or start queued Daily. Lead inspected dirty state/current agents/existing MapStruct mappers and service conversions. Exclusive Grok ownership: a0e4a353 recognition main/tests; 101a3d5d studyroom main/tests; 37483e51 auth/user/admin/document/post/topic/storage/assessment main/tests (importer behavior/legacy validation excluded). Prior read-only assignments for first two are CLOSED, now separate implementation briefs. Question/exam/current web/common/POM/migrations/status remain outside maintenance writes; current owners/drafts preserved. Read root/API AGENTS/backend skill, reuse mapper convention, preserve API shape/nulls/order/lazy loading/auth/privacy; keep business policy/validation/transactions/repository/storage calls in services. Recognition privileged evidence masking and studyroom lease/phase/request permissions must not become mapper decisions. No unnecessary per-feature mapper, dependency/schema/framework/architecture rewrite/format sweep. Direct English convention/dependency discussion permitted, no peer reassignment/ownership expansion. Return per-module evidence/intentionally retained rationale/full candidate/base/changed paths/focused checks/limits; Lead applies if patch tool unavailable, coordinates shared Maven target, integrates and explicitly disposes. Existing operational permissions/external-effect/cost boundaries unchanged; no blanket destructive/external authority.

Daily Accountability — local delivery accepted (04/10/2026): the question author/save/reopen and exam assemble/preview/publish/scheduled-read prerequisites were accepted at d1dc0d5. The Daily product decisions below are settled; the completed bounded Daily feature and its acceptance evidence are recorded above. Production authentication and deployment remain outside that local acceptance.

Daily queue binding scope: Daily belongs to User, never Group; backend/database unique user/calendar-day plan shared across all groups. Group membership grants no access by itself. New membership share_daily=false; Vietnamese toggle “Chia sẻ Daily của tôi với nhóm” OFF. Current owner/group settings (GROUP or SELECTED_MEMBERS of owner-selected active members) apply independently per group to all historical/current Daily/tasks/evidence/Daily Reviews/Weekly Reviews; ON exposes permitted history, OFF immediately revokes metadata and bytes, no per-day consent/snapshots. Owner allowed; every other request/nested resource requires active same-group membership, owner sharing ON and GROUP/selected authorization. No admin/group-privilege bypass; prevent ID/path/group/owner mismatch IDOR. Private evidence image/screenshot/file/link must not expose unprotected storage URLs bypassing revocation. Dashboard chosen day only returns permitted submission/count/rate/Must data; nonshared label must not reveal whether private Daily exists.

Daily tasks priorities MUST/SHOULD/COULD, statuses TODO/IN_PROGRESS/COMPLETED (TODO/COMPLETED allowed MVP); optional Start/Finish Evidence. Overall completed/total/rate and Must completed/total shown separately, no weighted score. Daily Review belongs to plan/inherits sharing and summarizes completion plus owner reasons/what went well/tomorrow adjustment. Weekly Review belongs to user/aggregates Daily plans (days planned/on-time, average completion, Must, recurring incomplete tasks/issues) plus owner reflection/next-week changes; same CURRENT group sharing revokes old reviews too. Conceptual ownership: Users -> Daily Plans -> Tasks -> Evidence/Daily Review; Users -> Weekly Reviews; Group Membership(group_id,user_id,share_daily,sharing_mode); selected mapping(owner_id,group_id,viewer_id). MVP: existing Auth integration, Groups/Memberships, Daily Plans/Tasks/Evidence, Daily/Weekly Reviews, Group Sharing/Feedback. Flow Plan -> Do -> Evidence -> Complete -> Daily Review -> Weekly Review -> Group Feedback. No leaderboard/gamification/public feed; streak/comments/reactions/notifications/completion history/statistics deferred.

Daily product decisions — settled 04/10/2026:

- Calendar: one platform timezone Asia/Ho_Chi_Minh (UTC+7), midnight day boundaries, Monday–Sunday weeks. Calendar conversion is centralized for future extension, but no user/location timezone selection in MVP.
- Submission: first explicit plan submission records one server timestamp for the personal plan across all groups. On-time means submission at or before that plan date's07:30 platform cutoff; edits do not reset it. Late plans remain usable. No personal/group deadline settings.
- Weekly figures: arithmetic mean of daily completed/total rates over nonempty planned days; show planned days/7 separately. MUST rate pools completed/total MUST tasks; zero MUST is N/A. No weighted score or extra statistics. Recurring unfinished work/issues are owner-authored weekly reflection, not inferred analysis, generated tasks or required structured links.
- Feedback: authors always identified to the recipient; one flexible text contribution can contain observations, suggestions or both, including multiple points. No mandatory paired fields, minimum response count, anonymous input, threads or general comments. Beneath a shared review show identified contributors and distinct contributing-person count. Current sharing/active-membership rules protect feedback and historical review metadata/bytes too; no privileged bypass.
- Bounded technical presentation: one editable contribution per author per review per group, enforced uniquely; multiline text, contributor list/count, no append stream. This does not require repeated submissions. Feedback remains attached to the group context so different audiences cannot leak each other's contributions. Reopen only if that interaction conflicts with the intended review use, not to re-ask the five resolved decisions.

Daily module boundary: study_room_members are lease/presence records, not consent membership. The accountability group foundation is separate from study rooms. Personal plans and reviews are user-owned; schema uniqueness is user/date and user/week, never group. Private evidence stays behind authenticated authorization with no-store, not public Cloudinary links. Code/names/enums/database/API use English; user-visible UI uses Vietnamese.

Completed bounded outcome: owner plan/tasks/evidence/save/reopen/submit/daily-and-weekly reflection, identified member feedback, explicit group invitation consent and current group/selected/history access with metadata-and-byte revocation are locally accepted through browser and real HTTP/PostgreSQL evidence above. Source tests and browser drivers remain available for reproduction; production-auth verification is a separate remaining limit.

1. **Manual authoring and exam assembly:** implementation authorized for the bounded increment below. Student attempts/submissions, grading and results/history remain pending; scheduled read-only exam access is not an attempt workflow.
2. **OAuth:** đã gỡ nút khỏi màn đăng nhập vì luồng callback/đăng nhập chưa hoàn chỉnh. Cần triển khai và kiểm tra backend trước khi mở lại.
3. **Chính sách và newsletter:** cần nội dung, endpoint và quy trình thực tế trước khi thêm lại các hành động này.
4. **Bảng tin chi tiết:** tiếp tục rà soát việc giữ bộ lọc/trang qua breadcrumb và cách xem trước bài chưa xuất bản. Đợt này chỉ chặn liên kết công khai sai từ màn quản lý.
5. **Import PDF, phân loại và form hồ sơ:** cần kiểm tra sâu hơn với dữ liệu/file thực, quyền thực và lỗi upload/worker. Kiểm tra bố cục hoặc menu không chứng minh toàn bộ nghiệp vụ của các màn này.
6. **Dịch vụ ngoài:** xác thực email/SMTP, file trên storage, YouTube và dữ liệu production cần kiểm tra trong môi trường triển khai. Browser mock chỉ chứng minh hành vi giao diện và hợp đồng request.
7. **Bundle:** Vite vẫn cảnh báo chunk chính lớn hơn 500 kB. Cần tối ưu tải thư viện theo route trong một đợt hiệu năng riêng.

## Kiểm chứng

### Authoring direction — 03/10/2026

Authorized implementation: manual reusable questions and complete exam assembly, preview and immutable published versions. Four forms: single-answer MCQ, multiple-answer selection, single-part written and multipart written with shared context. Question structure is separate from response type. Use ordered editable text/formula and figure groups, browser mathematical LaTeX plus mhchem, responsive full-width/side-by-side figures with captions/alt, and image fallback for unsupported diagram/full-document TeX. No arbitrary TeX execution or external AI calls.

Bank sharing is by subject: lecturers browse/reuse published items, edit their own drafts and duplicate others; admins manage all. Lecturers directly publish their own questions/exams. Bank content remains separate from exam-specific points, per-part weights, order and instructions. Publishing freezes selected content; later bank edits cannot alter a published version.

Scheduled exam access is read-only for authenticated students after release; author/admin/lecturers have internal visibility before release. Students receive no correct answers or model solutions in this increment. Optional model solutions are distinct from MCQ correct selections: drafts may be incomplete, while MCQ publication requires valid answer selections. Written questions may publish without model solutions. Future solution access requires an actual submitted attempt, existing solution material and explicit author/admin release; that entire gate remains pending until submissions exist. No self-declared completion shortcut, grading, results/history or RAG.

Automatic PDF/file extraction improvements remain deferred; preserve the existing importer and its configuration. No push/deploy, provisioning, live data mutation or external-service validation is authorized. Lead owns contracts, shared-file integration, local acceptance and the exact feature-scoped commit. Local acceptance will not imply deployment readiness.

Current work: Lead accepted the boundary investigations with corrections: multipart response types stay extensible, but this increment supports written-only multipart; release uses a releaseAt timestamp, with no invented expiry window. Accepted content shape lives in web scientific-content.ts (schemaVersion 1; ordered text/math/figure groups; stable-ID parts/options; separate answers/explanations). Existing legacy import JSON and import validation remain unchanged. New manual exams will initially accept published schemaVersion 1 questions only; imported legacy items remain usable through their existing staff workflow.

Ownership: Grok ad612229 owns the question module authoring/shared-bank/private-figure candidate, excluding importer files, plus V15 and question tests. Scientific Peer transferred all five component/helper/test files to Lead after its final correction; no further Peer edits there. Lead owns shared types, package manifests, status, shared JSON compatibility, routes and integration. Backend exam versioning and question/exam screen assignments follow accepted dependent contracts; they are not yet dispatched. Peers without apply_patch return bounded patches for Lead application, not alternate shell writes. Provider has no scoped approval mode; blanket auto-approval is not enabled.

Scientific Peer progress-only finish was not accepted: no patch or check results delivered. Lead requested the existing five-file candidate; ownership remains with that Peer. An alternate scratch Write-tool request was declined in favor of the assigned Lead apply_patch route. Dependent screen integration remains unassigned until the actual component artifact is inspected; backend question work continues independently.

Scientific five-file candidate subsequently delivered and mechanically applied by Lead. Focused source tests: 11/12 pass, one false assumption about KaTeX trust:false throwing for links; lint exits 0 with the existing 29 warnings. Not accepted: Peer corrections requested for safe-command feedback/tests, invalid-to-valid preview recovery, upload race/format/size handling, editor instructions and non-debug accessible image controls. Browser usability remains unverified. No dependent UI assignment yet.

Web build failed TS2322 at scientific-source.ts:356 (failure helper return type includes successful MathDecision, incompatible with MathRenderResult). Peer correction requested; failed build remains distinct from lint success and dependency smoke results.

Backend candidate delivered against cac1b839, with no tests run. Lead has not applied/accepted it: requested corrected chunks for known integration-test defects, existing-file patch syntax, lambda capture, flush-before-version response, mutation locking, subject/topic publication checks, and strict usable multipart/figure/answer shape. Source limits must match the accepted 16000-character renderer boundary. Backend Peer retains candidate ownership; exam dependencies remain pending actual artifact inspection and local checks.

Corrected backend chunks were applied mechanically, including authored Clock/SQL literal substitutions and existing-file Update conversion. Compilation passed. Focused Maven run: 22 tests, 1 failure, 5 errors, none skipped. Controller revealed Boot4 Jackson3 treating existing Jackson2 JsonNode as bean flags; Lead owns the shared compatibility dependency. One new unit test supplies content as answer. Full-context integration fails empty OAuth client registration and initializes unrelated import Redis infrastructure; Peer must replace with isolated PostgreSQL persistence slices before rerun. V15 applied in disposable PostgreSQL containers, not the deployment database. Backend remains unaccepted; WebP metadata-only/trailing-data checks also need correction.

Scientific final correction and ownership transfer applied. Current source tests pass 13/13; web build exits 0 (existing large-chunk warning). Earlier failed checks above are historical. Lead browser verification remains pending, so the component candidate is not yet accepted. No student-access or exam implementation has yet completed.

Backend correction loop closed: schema fixture and PATCH newline repaired, Jackson3/Jackson2 tree bridge verified, WebP canvas and embedded image dimensions bounded and required to match. Lead ACCEPTS the exact current question API candidate after full focused Maven suite: 26 tests, 0 failures/errors/skips, including real disposable PostgreSQL/Flyway, ownership, duplication, private figures, optimistic locking and HTTP nested JSON. Importer/legacy validator remain unchanged. WebP pixel bitstreams are not decoded; container/header checks are not full image decoding. Question scope transfers to Lead. Fresh read-only Grok ee6dac83 checks stable authorization/frozen-input assumptions; concrete findings can reopen acceptance.

Resumption found no surviving runners; prior /tmp browser evidence was lost. Repository scientific fixture now has a repeatable local Chromium check, with no API/external-service calls. Frozen exam implementation and manual question UI are the next separate scopes; student attempts/submissions/grading/solutions remain pending. No push/deploy authorized.

Fresh review accepted and closed with scoped corrections: imported published JSON can claim schemaVersion1 without manual validation, so exam preview/publication must independently revalidate content/answer/explanation, enabled matching placement and question-scoped private figures. Never snapshot legacy QuestionAsset URLs. Lead reopened question restore/conversion: restore now repeats publication validation; manual conversion/publication rejects attached legacy assets without deleting legacy data. Focused regression tests added; verification underway. Existing importer and student denial on staff-bank remain unchanged. Earlier26-pass acceptance is reopened only for these boundaries until regression verification; exam work incorporates this explicit validation requirement.

Boundary regression verification completed: QuestionServiceImplTest6 and QuestionManualAuthoringIntegrationTest3 pass, 0 failures/errors/skips. Lead ACCEPTS restore/conversion correction; question input acceptance restored with exam-side independent revalidation requirement retained. Maven runner free. Question UI Peer alternate search_replace permission declined: continue assigned deterministic patch handoff for Lead apply_patch, not a scope rejection or blanket edit grant.

Peer delivery route revised after checking actual handoffs: both original runs were idle/finished, not runtime-error blocked. Exam response claims10 patches but retrieved payload ends mid-patch2 (16347 characters; only one complete patch), so no full candidate acceptance/application. UI has drafting activity but no patch artifact. Preserve both existing sessions/drafted work; no restart. Resume small sequential handoffs capped at10000 characters: exam A migration then entities, B repositories/DTOs, C policies, D service/controller, E tests; question UI A API types/service/hooks, B pure model/tests, C figure resolver/viewer, D form/workspace, E pages. Lead applies and verifies each bounded handoff before requesting the next; original non-overlapping ownership and authorized outcome unchanged.

Current Lead resumption supersedes the observation-only stop; technical delegation/application/verification/acceptance and completed-feature local commit authority remain active. No rollback or draft restart. UI A three-file API contract patch applied and ACCEPTED (tsc -b exit0, diff check pass); UI B intent-only response remains unaccepted, actual pure model/tests requested. Exam V16 plus Exam/ExamItem applied; A still unaccepted until ExamPaper/ExamPaperItem/ExamPaperFigure arrive and schema checks pass. Only those remaining A entities requested before backend B. Ownership remains with existing respective Peers; Lead retains shared files and checks. No commit/push/deploy yet.

Latest artifact checkpoint supersedes the waiting text above: UI B manual-question.ts is applied in full; response exceeded10000-character cap but was not truncated. NOT ACCEPTED: B2 tests missing, staff-role mutation permission guard and publish figure-alt/empty-group feedback corrections requested from UI Peer. Exam A remaining3 entity patches applied; all5 entities plus V16 now present. NOT ACCEPTED pending compile/PostgreSQL schema proof. Interrupted tsc/Maven runner IDs no longer exist; on-disk Maven report predates these artifacts and is not evidence. Lead started fresh tsc -b and QuestionOptimisticLockIntegrationTest (all entities/Flyway V16 loaded); no competing runner. Lead owns result capture and dispositions at runner completion, then exam B repositories/DTOs can open; UI Peer owns corrections/B2 return checkpoint, then C viewer/resolver can open. No silent deferral or product-authority blocker; final usable path still lacks UI form/pages and backend service/endpoint/tests plus exam UI/end-to-end release proof.

Fresh UI B initial tsc result: FAIL exit2 (unused FigureGroupBlock import; Record type guard incorrectly narrows legacy branch to never at line92). That delivered model was rejected; subsequent correction supersedes it as recorded below.

Lead ACCEPT exam A (V16 and five on-disk entities): fresh Java25 compilation of328 sources and QuestionOptimisticLockIntegrationTest passed1, failures0, errors0, skips0; PostgreSQL/Flyway16 and Hibernate validation completed. Durable report: apps/api/target/surefire-reports/me.nghlong3004.olympic.question.QuestionOptimisticLockIntegrationTest.txt. Structural readiness only; frozen lifecycle/release authorization remain unverified. Exam Peer retains backend scope and has returned B1 limits/repositories after the explicit schema checkpoint; Lead owns application/verification before B2 DTO dispatch.

Lead ACCEPT corrected UI B model plus B2 tests: tsc -b exit0,6 Node tests pass with0 failures/skips, git diff --check exit0. Correction denies student-owner mutation controls and rejects blank published alt/empty figure groups; tests prove four payload forms, version0, pending figure retention and ordering/conversion guards. UI A unchanged. UI Peer next owns C authenticated figure resolver/viewer only; Lead owns integration evidence. Still missing usable form/pages, backend policies/services/endpoints/lifecycle tests, exam assembly/read-only screens and API save/reopen/frozen-byte/release proofs. No complete-feature commit yet; importer untouched, attempts/submissions/grading/student solutions deferred. Return checkpoints are each bounded Peer artifact and Lead verification, not idle-state polling.

Lead ACCEPT exam B1 six applied files (ExamLimits and five repositories): fields/queries inspected against A, Java25 compile334 sources BUILD SUCCESS, diff check0. Query execution and release privacy remain E-test obligations. Backend Peer next owns B2a request/draft/item/summary response patches <=10000 characters; separate student/staff paper records follow B2b. UI C proceeds independently. Lead owns verification at each return; no overlapping write scopes or runtime/provider blocker observed.

Exam B2a six request/response files applied; diff check passes, compile runner18229 pending. NOT ACCEPTED yet: request items needs @NotNull on each list element (current @Valid alone permits null). Backend Peer owns the tiny correction, then Lead verifies and opens B2b. Update must require expectedVersion; optional save version applies only to create. Null title/instructions require safe normalization in service; null-placement400 and stale/missing-version tests remain E obligations. UI C stays independent and active.

Superseding B2a checkpoint: null-element correction applied; Lead ACCEPT corrected six-file B2a after fresh Java25 compile340 sources BUILD SUCCESS exit0 and diff check0. Request/draft/item contracts match web inputs; runtime Bean Validation and update/version behavior still require E tests. Both compile runners18229/68786 completed successfully. Backend Peer now owns B2b separate student/staff paper projections and figure download record, in complete patches <=10000 characters; student projections must not declare answer/explanation. UI C remains its separate ready branch. No external effects or feature commit.

Lead ACCEPT B2b eight applied files: student/staff-plain records omit answer/explanation; staff solution and nullable preview are separate projections. Java25 compile348 sources BUILD SUCCESS exit0; diff check0; runner75207 complete. This establishes DTO structure, not HTTP leak prevention or release authorization. Backend Peer next owns C1 placement policy, then C2 independent question trust policy after checkpoint; UI C still independent. Snapshot lifecycle, authenticated release, figure privacy and usable save/reopen remain pending integration evidence. Importer preserved; no attempts/submissions/grading/student solutions or external effects.

Lead REJECT initial C1 policy, not applied: List.of.contains(null) and Map.of.containsValue(null) can throw NPE for valid immutable collections. Backend Peer owns safe iteration correction and focused policy tests, moved earlier from E to prove bounds/weights/null handling before C2 dispatch. Precision must agree with request @Digits. Preserved C2/D/E drafts remain intact; UI C independent. Return checkpoint: complete corrected policy/test patches <=10000 characters, Lead execution and explicit disposition.

Lead ACCEPT corrected C1 policy and six focused tests after fresh ExamPlacementPolicyTest6/6,0 failures/errors/skips, BUILD SUCCESS. Safe iteration resolves immutable collection NPE; precision strictly rejects scale>2. Supplemental seventh test for title/instruction bounds, release, extra key and immutable ordered weights applied and verification pending. C2 independent question-source trust policy now assigned to retained backend Peer; Lead owns supplemental result capture. Durable suite report: apps/api/target/surefire-reports/me.nghlong3004.olympic.exam.service.impl.ExamPlacementPolicyTest.txt. UI C continues independently; full lifecycle acceptance still pending.

Supplemental evidence remains UNKNOWN: source has7 tests but incremental Maven twice ran cached6-test class and reported up-to-date. Lead launched clean rebuild runner30815 to remove stale generated output; source untouched. No supplemental pass claim until seven tests execute. Earlier six-test C1 acceptance unchanged; C2 remains independently ready. Clean removes regenerable target outputs/reports, not source or Peer drafts.

Superseding supplemental result: clean rebuild30815 passed all7 policy tests,0 failures/errors/skips; Lead ACCEPT supplemental test candidate. C2 exact single source-policy file applied and inspected: published integer schema1, enabled paired subject/topic, question-scoped private figure IDs passed to manual draft/publish validators; JSON deep copies, no legacy assets. Question topic is NOT NULL with FK in V8/JPA. Compile8326 pending; C2 not yet accepted. Bytes remain live QuestionFigure references until D copies them into paper rows; no frozen-byte or HTTP/privacy claim at this checkpoint.

04/10 resumption supersedes stale pending text: C2 ACCEPT compile350 success; retained D1 ExamService handoff applied, inspected and ACCEPTED after fresh Java25 compile351 sources BUILD SUCCESS exit0/diffcheck0. Interface alone does not enforce authorization or freezing. UI C helper correction explicit host field applied; Lead ACCEPT helper/tests after fresh Node3/3 pass0 skips, tsc -b exit0 and diffcheck0. Original strip-only/TS1294 failure is repaired, not ignored. Existing Grok sessions and drafts preserved; no rollback/restart. Backend Peer now owns bounded D2 implementation handoffs (split order first if cap requires); UI Peer owns remaining C hook/viewer handoffs. Lead owns integration, result capture, acceptance and completed-feature local commit. Each response <=10000 characters; no overlap or alternate writes. Dispatch returned running successfully for both sessions; no refresh-token error observed on these calls. Next usable checkpoint is authenticated manual figure viewing and executable draft/publish/read API, then forms/exam screens and real save/reopen/snapshot/release/privacy proof. Importer untouched; attempts/submissions/grading/student solutions deferred; no push/deploy/external effects or complete-feature commit.

Lead ACCEPT D2 delivery split (not implementation): ExamAccess, ExamProjections, ExamDrafts, ExamPublication, ExamPaperReads, then thin ExamServiceImpl. Retained backend Peer next owns D2a ExamAccess; public interface unchanged and orchestration transaction must keep parent/question/figure locks, revalidation and byte snapshot atomic. No question-repository edits outside scope; missing lock capability reopens a specific dependency. Helper boundaries serve complete <=10000-character handoffs, not new delivery goals or extra agents. Detailed consequential candidate inspection/verification evidence may go to a fresh read-only Grok Peer on an exact stable snapshot; Lead retains explicit final acceptance and smallest-path integration proof. No routine re-review/count gates. UI C remains independent; all agent briefs/dispositions in English.

Path-level frontier supersedes file-oriented completion language; in-flight D2a/UI C and accepted inputs/drafts/ownership remain unchanged. Small patches are delivery slices, not additional feature acceptance layers.

- Question usable outcome: staff author all four forms -> save -> reopen with scientific source intact, persisted private figures resolved through authentication, and pending figures retained/surfaced locally across save rather than silently discarded. Remaining: React resolver/viewer, form/page wiring and save/reopen/error/retry/version-conflict proof. UI Peer owns implementation slices; Lead owns shared integration and end-to-end evidence. Pending figures must not be misrepresented as persisted across reload before upload; source/persisted figure roundtrip and pending-local retention are separate assertions.
- Exam usable outcome: assemble ordered weighted published manual questions -> preview plain/solutions -> publish immutable version of JSON and referenced private bytes -> ACTIVE authenticated student read at releaseAt<=serverClock, no answer/explanation keys or solution-only bytes. Remaining: orchestration/helpers/controller, lifecycle/security/snapshot concurrency tests, assembly/preview/paper screens and end-to-end verification. Backend Peer preserves D2/E drafts; Lead integrates shared contracts and dispatches ready separate web-exam scope when accepted inputs suffice. No expiry or student workflow invention.
- Next checkpoints: finish current D2a/UI C without restart; route subsequent bounded slices by the above usable outcomes and dependency evidence. On a stable consequential assembled candidate, fresh read-only Grok Peer gets exact snapshot and original path question for concise findings/checks/limits/recommendation; Lead performs path-level integration verification and explicit ACCEPT/REJECT. No routine extra review or blanket re-review of accepted inputs. Local feature commit only after a complete path meets its stated criteria; importer, attempts/submissions/grading/student solutions and no external-effects boundary unchanged.

Current path checkpoint: UI hook/viewer applied, tsc -b exit0 and diffcheck0; NOT ACCEPTED pending bounded lifecycle evidence from fresh read-only Grok101a3d5d. Exact four-file SHA256 snapshot recorded in review brief (helper, hook, viewer, helper tests); writer paused on candidate, D drafts preserved. Review question is account/query isolation, stale/inflight Blob reuse, StrictMode URL cleanup, retry and hidden solutions, not whole save/reopen acceptance. Initial create call failed provider-argument validation; corrected grok/grok-4.7 call succeeded, no token-error claim. Backend D2a ExamAccess applied independently, compile25798 pending; runtime authorization/locking reserved for assembled service tests. Lead owns final dispositions and path integration; existing implementation Peers/ownership unchanged.

Backend ready branch advanced: Lead ACCEPT D2a ExamAccess as integration input after compile352 sources BUILD SUCCESS exit0; runtime authorization and lock validity still require assembled ExamServiceImpl transaction/E proof. Retained backend Peer now delivers D2b projections toward the same assemble/preview/freeze/release path, not a separate feature acceptance goal. UI reviewer snapshot read-only check allowed once; candidate stays frozen pending findings and Lead disposition. No overlap, restart or external effect.

Frontier correction: actual D2b activity has a complete9735-character mapper patch but no handoff, with repeated counts/reshaping consuming time. Backend owner instructed to return exact complete current candidate now with minimal prose, no further count commands or architectural split for transport. Any transport-cap exception must be explicit; Lead retrieves full artifact and verifies completeness/hash. Review owner101a3d5d instructed to stop dependency lookups and return decision-ready findings/recommendation from current evidence, with UNKNOWN semantics clearly separated and specific repair/test obligations. These return events—not another count/search—are the next checkpoints. UI writer candidate freeze ends after Lead disposition routes concrete repairs; preserved form/page drafts remain available. Next usable outcome is author/save/reopen once resolver/form/pages integrate, and executable assemble/preview/publish/released-read API once preserved backend implementations/controller/tests integrate. Mapper compile or review completion alone is not either usable outcome. Lead owns focused end-to-end evidence and final path acceptance; no added layers/scopes/external effects.

D2b actual complete handoff received and applied without reshaping: ExamProjections SHA2567525dca1fd5db2223326daea6f275e2415b9c8fc5f5bb413b189206d0b41bc6c, complete patch9734 characters excluding terminal newline. Diffcheck0; compile20734 pending. Preserved backend implementation continues at runner disposition; mapper is an integration slice, no extra review layer or usable-exam claim. Frozen-paper serialization/byte-copy/release obligations remain assembled-path tests. UI review response remains the other independent return checkpoint.

Lead ACCEPT D2b exact hashed integration input: compile353 sources BUILD SUCCESS exit0/diffcheck0. Backend Peer continues preserved ExamDrafts then publication/read/orchestration toward executable vertical path; no count-loop or transport-driven redesign. JSONB object field order is not a persistence guarantee; content.parts array owns part order, weights are mapped by stable ids and E roundtrip must prove that. Full frozen serialization/auth/release/byte lifecycle acceptance remains pending. UI candidate still awaiting decision-ready independent findings, not blocking backend.

D2c ExamDrafts complete patch applied, diffcheck0, compile30698 pending. Disposition pending specific parent-version repair: child replacement alone does not dirty parent, and identical updatedAt/header under fixed Clock may leave @Version unchanged. Backend Peer owns targeted guarantee that every successful update increments once and response reports flushed version; fixed-clock item-only/no-op/stale-next-write regression remains E proof. No extra delivery layer or architecture/count-loop; preserve publication/read/orchestrator drafts. UI repair remains independent.

D2c compile result:354 sources BUILD SUCCESS exit0. Lead REJECT current update-version guarantee pending targeted repair (compile is not concurrency proof); candidate kept on disk, no rollback. Backend owner/checkpoint remains corrected version-guarantee patch plus specified runtime regression, then onward publication/read integration. UI repair branch independent.

Lead ACCEPT corrected D2c integration input: microsecond-monotonic updatedAt repair applied, compile354 BUILD SUCCESS exit0/diffcheck0. Fixed-clock item-only/no-op version once, reloaded response and stale next write remain E database proof. Backend proceeds preserved publication slice toward frozen-byte path.

UI repair response fully retrieved (helper5397, hook6608, tests10510 chars), not applied; Lead REJECT render-side-effect route: cache.bind during render revokes committed URLs and mutates cache, unsafe for aborted/concurrent React renders. Existing pure identity-bound resolve can mask mismatches; bind/revoke/publish must occur at layout-effect commit before paint. UI Peer owns targeted revision against current on-disk pre-repair files plus actual local React fixture/repro evidence; helper/source-string tests alone are not real QueryClient/auth lifecycle proof. Viewer unchanged, D drafts preserved. No response-size reshaping/count loops or new review gate; this exact repair/checkpoint serves safe question save/reopen integration.

Publication slice complete11498-character patch retrieved/applied without transport-driven redesign; SHA2560357ca9f90e8fa0339b959906fefda1076ac2b537e34cb8788f27c30a9c3cc4a. Diffcheck0; compile79558 pending, NOT ACCEPTED. Exact publication file frozen for fresh read-only Grok atomicity/byte/privacy evidence review; caller transaction and PostgreSQL concurrency remain assembled-path test obligations. Retained writer continues independent ExamPaperReads on accepted inputs while review runs, not waiting on publication. Lead owns hash/result capture/final disposition and vertical-path integration; UI targeted repair independent, drafts/ownership preserved.

Publication compile79558 completed:355 sources BUILD SUCCESS exit0. Superseded disposition: Lead ACCEPTS exact ExamPublication SHA2560357ca9f90e8fa0339b959906fefda1076ac2b537e34cb8788f27c30a9c3cc4a as an integration input after bounded read-only review a0e4a353; Lead remeasured the same hash. Review closed, not whole-path acceptance. Caller must own one write transaction, load exam first through requireOwnedLocked, and load no question/figure before the helper locks/materializes them; no REQUIRES_NEW. Locks do not refresh already-managed entities. PostgreSQL E still owns visible-wins figure deduplication, fixed-clock version once, rollback after flushed paper/items on invalid bytes, UPDATE-trigger rejection and two-session source lock/coherent snapshot proof. Triggers prohibit UPDATE, not DELETE; no broader database immutability claim.

Lead ACCEPTS ExamPaperReads D2e integration input: Java25 compile356 sources BUILD SUCCESS exit0/diffcheck0. Inclusive release, ACTIVE/deleted denial, student solutions=true stripping, content bytes allowed/solution-only404 and preview no-insert/forged-input rejection remain E proof. Backend owner577534b2 resumes preserved transaction service/controller/tests toward executable assemble-preview-publish-release API; return checkpoint is complete service/controller artifact, then focused database/HTTP results captured by Lead. Publication review is no longer a blocker.

Lead ACCEPTS applied orchestration/controller as integration candidate: ExamServiceImpl SHA2563c6e495581eaee600b16229656de8b2e9f82a439806d86de028ec3a662185fba and ExamController SHA2562d6ec948a191826c45bbe5c64f61494b7d1cc18e9e0611e3dd04877bb069bc6a; Java25 compile358 BUILD SUCCESS exit0/diffcheck0. Publish/update first load owned locked exam in one write transaction, no question/figure service preload, reads readOnly; literal paper routes and private no-store/nosniff bytes wired. Existing security defaults authenticated, unchanged. Endpoint startup/routing, PostgreSQL lifecycle, HTTP student serialization and concurrency remain unverified. Existing backend writer now returns preserved E tests; Lead applies/runs captures concrete failures/UNKNOWNs before whole-path acceptance. No extra review gate or external effects; web-exam usable screens still missing.

E vertical candidate fully retrieved/applied: ExamVerticalIntegrationTest uses disposable PostgreSQL, real service/controller and standalone MockMvc; security filters/JWT/anonymous401 excluded explicitly. Lead run Java25 ./mvnw -Dtest=ExamVerticalIntegrationTest test FAILED at testCompile: line68 tools.jackson.datatype.jsr310 does not exist (JavaTimeModule). No PostgreSQL assertions ran; candidate NOT ACCEPTED. Existing backend writer owns minimal fixture correction against applied file, no production/dependency change indicated. Return checkpoint corrected patch, then Lead rerun; broader E rollback/concurrency/frozen-source/disabled-user obligations remain separate unverified cases.

Vertical rerun after JavaTimeModule removal compiled and ran PostgreSQL16/Flyway16:1 test, failures1/errors0/skips0 at line231 $.code missing on future student404. Create, plain/solution preview, publish and staff reads were reached/passed; exact-release assertions not reached. Standalone mapper Spring ProblemDetail mixin correction applied without weakening code assertions or changing production/POM; Maven45002 rerun pending Lead result capture/disposition. java.time serialization was exercised, but full production mapper/security parity is not claimed.

Superseding vertical disposition: Maven45002 BUILD SUCCESS exit0; ExamVerticalIntegrationTest1 passed, failures0/errors0/skips0 on PostgreSQL16/Flyway16. Lead ACCEPTS this bounded executable API proof: create, both preview projections/no paper insertion, publish, literal paper list, future student404, exact release inclusive read with no answer/explanation keys and nested scientific JSON/part weights, allowed content bytes and denied solution-only bytes/no-store/nosniff. Durable report apps/api/target/surefire-reports/me.nghlong3004.olympic.exam.ExamVerticalIntegrationTest.txt. Standalone MockMvc excludes security filters/JWT/anonymous401; broader E frozen-source survival/version/rollback/concurrency/validation/disabled-user proof and web screens still pending, so whole feature not accepted. Backend writer owns remaining E candidates; Lead execution/disposition checkpoint at each complete runnable artifact.

UI revision-bound repair fully retrieved/applied (seven ordered patches): Node6/6 pass, tsc-b0/diffcheck0. Browser first failed at retry button because local Axios adapter resolved500 rather than rejected; fixture-only rejection correction applied. Full rerun fails first-mount request and sibling-unmount live-URL checks, browser runtime errors empty. Evidence /tmp/figure-resolution-evidence/results.json, runner tests/figure-resolution-browser-check.mjs. UI candidate remains NOT ACCEPTED; existing UI writer owns concrete hook/fixture diagnosis/correction, D form drafts preserved. Vite4308 remains Lead-owned runner83666. Return checkpoint targeted patch and full lifecycle rerun, not dependency-search/review/count loops; helper tests alone do not establish lifecycle safety.

Superseding UI lifecycle disposition: fixture mount assertion corrected to wait for Q_MOUNT request and committed distinct URL instead of capturing previous retry URL. Full browser8807 exits0, report ok:true/errors empty, diffcheck0; prior Node6/6 and tsc-b0 remain. Lead ACCEPTS applied account/revision-bound resolver/helper/viewer as downstream integration input with this bounded local lifecycle proof (settled/inflight account switch, token-before-profile transition, logout/expiry, retry, two mounts/sibling URL cleanup, StrictMode, hidden solution). Local adapter/QueryClient fixture is not API save/reopen or whole question UI acceptance. Web build/lint runners pending; existing UI writer resumes preserved D forms/pages toward four-form author-save-reopen with source/private figures and pending-local retention. Lead owns shared routes/contracts and end-to-end evidence; no shared auth changes/external effects.

UI integration checks completed: pnpm build95227 exit0 (tsc plus Vite3625 modules), pnpm lint exit0 with warnings including two fixture Fast Refresh warnings and existing application warnings; build chunk-size/plugin-timing warnings nonfatal. Resolver integration acceptance stands with local-fixture limits above. Existing writer D form/page return remains next question-path checkpoint; no API save/reopen or completed-feature claim.

Lead ACCEPTS next bounded exam lifecycle evidence: Maven25231 Java25 BUILD SUCCESS exit0; ExamVerticalIntegrationTest4 tests pass failures0/errors0/skips0 on PostgreSQL16/Flyway16, diffcheck0. Added proof covers frozen JSON/private bytes surviving later direct source edits, frozen-table UPDATE rejection with unchanged values, fixed-clock no-op/item-only updates and publication version once with reload/stale conflicts, and duplicate placement figure-row deduplication. Exact trigger-message assertion, updatedAt microsecond progression, cross-placement visible-wins variant, rollback after flushed rows, concurrent publish/source-lock wait, invalid/legacy/disabled inputs and security-filter proof remain open. Source V15 permits blank original_name while copy rejects it, so rollback test can use schema-valid blank name without a production hook. Existing backend writer owns next targeted E artifact, Lead executes/disposes; full feature/web screens remain pending.

Correction to previous rollback route and earlier review description: exact requireCopy allows blank original_name; Lead verified current source, so blank-name rollback proposal withdrawn. No production change made; post-flush rollback remains unproved. Latest bounded validation/disabled-actor/concurrent/source-lock test additions retrieved/applied; diffcheck0, Maven45784 pending. Concurrency submissions lack start barrier and question relation-only pg_locks probe can miss transactionid waits: green alone will not establish deterministic overlap/source locking; runtime disposition must preserve these limits. Current question form/page writer remains active, accepted resolver/build/browser inputs unchanged. Daily Accountability queued behind explicit whole-increment closure, not a reason to restart/delay either branch.

Maven45784 completed:10 tests,9 pass/1 failure,errors0/skips0 on PostgreSQL; failure publishWaitsForQuestionLockAndKeepsThatSnapshot line614 relation-only lock waiter probe false. Latest E patch NOT ACCEPTED as whole. Existing backend writer owns targeted deterministic publisher-session blocking probe/concurrent start-barrier correction and open post-flush rollback strategy; no mapper maintenance edits overlap exam/question. Prior accepted4-test evidence retained, new per-case successful evidence distinct from failed locking assertion. Lead owns rerun/checkpoint; UI form/page path continues independently.

Next E correction fully retrieved/preserved NOT APPLIED: pg_blocking_pids anchored to held source connection and disposable test-only INSERT-fault trigger address lock/rollback route, but Lead REJECTS concurrent setup that polls a granted tuple lock after starting an unblocked publish. Uncontended row locks may not appear and first publish may commit before observation. Existing backend owner returns corrected full patch against current disk using explicitly held exam row, synchronized two attempts, observed blocking/unfinished futures before release, then success/conflict. No production hook or framework-search expansion; current ownership/drafts unchanged.

E deterministic held-row/barrier correction applied (one mechanical diff context marker fixed); Maven30533 eleven tests10 pass/1 failure/errors0/skips0. Source-lock snapshot and disposable figure-insert post-flush rollback passed; concurrent blocker-count assertion failed because chain filter allowed transactionid only, excluding tuple waits. Targeted all-Lock chain correction plus diagnostics now applied; Exam26737 rerun pending. No production change/security-filter proof claim.

Recognition maintenance complete candidate applied: AchievementMappingSource/RecognitionMapper/RecognitionMapperTest/service wiring; focused Java25 Maven80780 four tests3 pass/1 failure/errors0/skips0. REJECT candidate pending exact private byte-reference preservation: generated MapStruct cloned content where old conversion passed same array; test line137 caught change. Service masking/points/storage remains service-owned; response immutable collection/null-element semantics and integration mapper bean wiring also returned to recognition owner for targeted correction. Studyroom complete candidate retrieved/preserved NOT APPLIED while shared runner coordinated; owner asked to preserve original immutable collections, not just order. Stable-modules owner remains independent. Lead explicit dispositions required; mapper maintenance doesn't block current UI/exam ownership.

Superseding E result: Exam26737 Java25 BUILD SUCCESS exit0;11 tests pass failures0/errors0/skips0 PostgreSQL16/Flyway16. Lead ACCEPTS bounded suite evidence including deterministic observed publish overlap/one success-conflict, source-row lock then coherent committed JSON/private bytes, post-flush figure INSERT-fault rollback, validation/disabled-deleted publisher/forged-foreign/legacy URL omission/disabled placement checks. Durable ExamVerticalIntegrationTest report. Security filters/JWT/anonymous401/disabled-deleted student reads plus remaining named multipart/version2 cases still open; whole product not accepted. Existing backend writer next security-boundary evidence, current UI writer forms/pages unchanged.

Stable-module mapper audit/candidate fully retrieved NOT APPLIED: actual admin response factory -> AdminUserMapper and avatar UploadedFile -> existing FileMapper, other owned conversions intentionally retained as already mapped or policy/enrichment. Lead REJECTS candidate pending preserving disclosed null User and null UploadedFile failures; partial-null response/folder-only persistence would change old behavior. Existing owner37483e51 returns corrected full candidate with null regressions; permission-set identity/crop/null component semantics remain required. No shared mapper/dependency/production policy expansion.

UI latest six-patch layout-effect repair fully retrieved and preserved, not applied or accepted: cached profile id plus live token does not establish account correspondence; proposed inflight fixture revisits fresh cached A/B keys rather than forcing held new requests. Existing UI ownerb6b07a6d repairs live-session isolation and deterministic new-key fixture without shared-auth changes unless explicitly requested. Return checkpoint is complete corrected candidate plus executable local React/browser proof (transition commit, settled/inflight A->B, logout/expiry revoke, retry, two mounts, StrictMode, hidden solutions), then Lead disposition enables preserved form/save/reopen work. No count loops, extra review layers, restart or external effects.

Lead ACCEPT bounded UI review findings as actionable and REJECT current hook slice: query key lacks account identity, old object URL can be returned during identity-transition render before effect revoke, global figure-prefix reset on ordinary mount interferes with independent resolvers. Reset scheduling/microtask races remain UNKNOWN; not used as proven findings. Reviewer did not run TSX/browser/checks or remeasure final hashes, recorded limits; read-only scope closed. Viewer showAnswer=false hiding is not the rejection. Existing UI Peer owns targeted helper/hook/tests repair, freeze released only for that scope; account-scoped local query keys avoid shared-key edits, identity-bound render resolution/revocation and scoped freshness replace timestamps/global resets. Return checkpoint: complete repaired candidate plus bounded local React regression fixture/evidence plan for settled/inflight A->B, logout/expiry, switches/two mounts/StrictMode/retry and no solution fetch. Lead owns execution and explicit disposition, then question form/save/reopen integration. Backend path continues independently; no restart/additional review layers or external effects.

Frozen-exam backend ownership: Grok 577534b2 owns only new API exam module, V16 and exam tests. Accepted input is the current question API; no importer/question/shared-config edits. Draft API: /api/v1/exams list/create, /{id} get/patch with expectedVersion, /{id}/publish with expectedVersion, /{id}/preview?solutions=false. Paper API: /papers released summaries, /papers/{paperId} frozen paper and /papers/{paperId}/figures/{assetId}. Staff may internal-preview before release; ACTIVE authenticated students receive only releaseAt<=serverClock papers, never answer/explanation keys or solution figures. Each publication snapshots content and private raster bytes into a new immutable version. Draft releaseAt may be null, publication requires it; no expiry invented. Exam UI waits for actual accepted backend artifact; Lead retains routes/shared web contracts and integration.

Scientific rendering/editor base accepted by Lead for downstream integration: source tests13/13, prior web build/lint pass, repeatable Chromium check now4/4 light/dark at320/1440 with no overflow/runtime exceptions and invalid-to-valid math recovery. Evidence /tmp/scientific-component-evidence; runner tests/scientific-browser-check.mjs and fixture tests/fixtures/scientific.html. This is component-only evidence, not upload races/API save-reopen/exam proof; those remain integration checks. Question-screen Peer owns only question service/types/hooks, new non-scientific question UI components and question bank/detail pages/tests. Existing scientific files, shared routes/navigation, exam web files and importer remain outside its scope.

New figures use immutable private PostgreSQL rasters (JPEG/PNG/WebP, at most 5 MiB each) rather than public Cloudinary URLs; existing importer assets are not migrated. Student figure access will be scoped to visible blocks in a released frozen exam, never solution-only references. Scientific rendering uses locally bundled KaTeX 0.19.0/mhchem, explicit prose math delimiters and math blocks, editable source and bounded expansion; unsupported document/diagram code receives feedback plus image fallback. Five direct bounded renderer samples passed (fractions/integrals, matrix, aligned, cases, chemistry). This is dependency evidence only, not browser/API E2E or feature acceptance. Exam placement/paper contract is in web features/exams/types.ts; question-bank content carries no points. Implementation candidates and full local acceptance remain pending.

- `cd apps/web` rồi `rtk pnpm build`, `rtk pnpm lint`.
- `rtk proxy node --test tests/*.test.ts`: 17 kiểm tra cho URL sau đăng nhập, phân trang/đường về danh sách và GPA.
- Trình duyệt Chromium/Playwright với API mock: guest/student/lecturer/admin; viewport 320, 390, 768 và 1440px; sáng/tối; tên người dùng dài; focus, Escape, đóng menu theo route/history/resize, sidebar và giảm chuyển động.
- Luồng tài liệu: tìm/lọc/Back/reset, cách xem, phân trang không hợp lệ, tải riêng khỏi liên kết chi tiết; xem trước không gọi endpoint tải.
- Luồng quản lý: phân trang/tìm/chi tiết câu hỏi, lỗi thao tác, loading/lỗi/thử lại tài liệu và bài viết, chỉnh sửa bài viết sau lỗi, phân trang và cấp/thu hồi quyền người dùng.
- Kiểm tra hồi quy phòng học: yêu cầu đăng nhập, tạo/tham gia, đề xuất/duyệt nhạc, polling, lỗi kết nối, đóng phòng; tài khoản mobile không tải video, desktop giữ cảnh khi đổi form, reduced motion.

Các kiểm tra trình duyệt dùng mock cho server và YouTube; không thay thế việc chạy thử với backend và các dịch vụ bên ngoài. Không sửa Java, migration hoặc hợp đồng API trong đợt UX này.

## Rà soát bổ sung: mạng chậm, video và luồng phục hồi

Ngày 01/10/2026, sau các thay đổi điều hướng ở trên. Đợt này chỉ rà soát và ghi nhận; chưa sửa các lỗi bên dưới. Dùng lại kết quả build/lint và các kiểm tra hồi quy đã chạy; bổ sung tình huống chưa được kiểm chứng thay vì chạy lại toàn bộ.

### Các vấn đề còn tồn tại

P1: ưu tiên xử lý trước khi coi luồng hoàn chỉnh. P2: cần sửa để trải nghiệm ổn định và có đường phục hồi.

| Ưu tiên | Luồng và bằng chứng | Vị trí sở hữu | Hướng xử lý |
| --- | --- | --- | --- |
| P1 | **Phiên hết hạn:** `/documents` trả 401, refresh trả 401; header vẫn hiện tài khoản cũ. Đi tới `/login` trong cùng SPA bị chuyển về `/admin/dashboard` thay vì cho đăng nhập lại. Đã tái hiện bằng browser mock. Backend vẫn kiểm tra quyền; đây là lỗi trạng thái phiên/UI, không phải bằng chứng vượt quyền. | `src/lib/axios.ts:82`, `features/auth/hooks/use-current-user.ts:14`, `router/guards/guest-route.tsx` | Khi phiên thực sự hết hạn, đồng bộ token và cache người dùng ở luồng xác thực; cho đăng nhập lại và giữ URL cần quay về. Phân biệt refresh 401 với lỗi mạng tạm thời. |
| P1 | **Upload PDF:** UI nhận và ghi tối đa 25 MB; nginx chặn request trên 10 MB, dev multipart cũng 10 MB. File 10–25 MB không đi qua được cấu hình này. Xác nhận từ cấu hình, chưa chạy upload thực qua nginx. | `pages/assessment-import-page.tsx:26`, `nginx.conf:12`, `apps/api/src/main/resources/application-dev.yaml:16` | Thống nhất giới hạn giữa UI, proxy, multipart và import service; request limit cần dư cho multipart overhead. Có thông báo 413 rõ ràng. |
| P1 | **Nhập đề mất đường phục hồi:** tạo job thành công rồi status trả 503; sau ba lần request, màn chỉ còn tiêu đề/mô tả, không có lỗi hay nút thử lại. Reload quay về form upload vì `importId` chỉ nằm trong state. Không có bằng chứng job backend bị mất; UI mất đường mở lại job. Đã tái hiện. | `pages/assessment-import-page.tsx:13`, `features/assessment/hooks/use-assessment-import.ts` | Giữ job ID trong URL, có trạng thái lỗi/thử lại cho status và drafts, cho tiếp tục đợt nhập sau reload. |
| P2 | **Tải tài liệu bị treo:** giữ request file chưa trả về; Escape không đóng dialog, nút Hủy bị vô hiệu hóa. File fetch dùng Axios độc lập, không có timeout hay AbortSignal. Đã tái hiện. | `features/documents/components/document-download-modal.tsx:87`, `features/documents/services/documents.service.ts:27` | Cho hủy request và đóng dialog, timeout phù hợp, có thử lại; dọn timer reset/autoclose để không tác động tài liệu mở sau đó. |
| P2 | **Bảng tin:** từ danh sách có `q/type/page` → bài viết → breadcrumb quay về `/news`, có một document reload và mất toàn bộ bộ lọc. Status 503 của chi tiết lại báo bài viết không tồn tại/đã xóa, không có retry. Đã tái hiện. | `features/post/components/post-list-item.tsx`, `features/post/components/news-detail-feature.tsx:177`, `:223` | Giữ đường về danh sách và dùng React Router Link; tách 404 khỏi lỗi mạng/server, cho thử lại. |
| P2 | **Loading khi tải mã trang:** chặn chunk toolkit khi mở trực tiếp `/toolkit?tool=gpa`: header/footer xuất hiện nhưng `main` rỗng, không có `aria-busy`. Khi chuyển trong SPA, trang trước được giữ lại trong lúc chờ nhưng URL đã đổi và không có chỉ báo tải. Đã tái hiện cả hai. | `router/routes.tsx` (`Suspense fallback={null}`) | Loading nhẹ theo route, giữ shell; có chỉ báo pending khi giữ nội dung cũ. Skeleton đăng nhập cần bỏ phần OAuth đã gỡ khỏi form thật. |
| P2 | **Nhãn form có dữ liệu sẵn:** ở hồ sơ, giá trị họ tên có ngay nhưng nhãn vẫn nằm trong input, đè lên chữ. `FormField` khởi tạo `hasValue=false`, chỉ cập nhật khi change/blur; ref không đồng bộ trạng thái có dữ liệu. Xác nhận bằng screenshot mobile và code. | `components/ui/form-field.tsx:65`, `:67`, `:95` | Sửa tại primitive dùng chung để nhận đúng giá trị khởi tạo, controlled value và cập nhật bằng form reset; kiểm tra cả autofill. |
| P2 | **Hồ sơ mobile và lưu dữ liệu:** tại 320px, username 48 ký tự và email dài làm các ô thông tin vượt card, bị cắt bởi layout. Lưu họ tên thành công vẫn để nút Lưu hoạt động vì dirty state không reset. Đã tái hiện. | `features/user/components/profile-form.tsx:29`, `:89`, `:138`, `features/user/hooks/use-update-profile.ts:14` | Cho grid/text co và xuống dòng; reset form theo dữ liệu server sau khi lưu thành công. |

Các animation trong chi tiết bảng tin còn dùng Framer Motion mà chưa có xử lý giảm chuyển động tại component. Đây là phần cần kiểm tra tiếp khi sửa màn bảng tin, không phải kết quả đo hiệu năng thiết bị thật.

### Video: không cần chặn cả trang để preload

- Hai file cộng lại 5.004.792 byte: sáng 3.467.139 byte, tối 1.537.653 byte. Mỗi lượt vào chỉ chọn video theo theme, không tải cả hai ngay.
- Poster WebP sáng/tối lần lượt 55.144 và 89.838 byte. Browser mock xác nhận nội dung và menu dùng được khi video chưa trả về, và poster vẫn giữ khi video tải lỗi. Mobile auth không mount cảnh video và không request video.
- Cả hai MP4 có `moov` ở offset 32, trước `mdat`; có thể stream, không cần đợi tải hết file mới phát. Component chỉ hiện video sau sự kiện `playing`.
- Luồng nên giữ: **hiện shell/nội dung + ảnh poster → video tải nền → fade sang video khi phát được**. Lỗi/autoplay bị chặn/giảm chuyển động thì tiếp tục dùng poster. Không đặt màn phần trăm đợi video trước khi vào website.
- Tối ưu tiếp: cache media có cơ chế version khi đổi file (nginx hiện chỉ đặt cache lâu cho `/assets/`); ưu tiên poster đang dùng; hỗ trợ chế độ tiết kiệm dữ liệu; giảm dung lượng chunk chính. Loading thật thuộc route và request dữ liệu, không thuộc việc tải xong cảnh nền.

### Giới hạn kiểm chứng và thứ tự tiếp theo

Browser Chromium dùng bản preview tại `127.0.0.1:4173`, API được mock để ép 401/503 và request bị treo. Backend tại `localhost:8080` không chạy ở thời điểm review; chưa xác nhận lại SMTP/storage/YouTube và nghiệp vụ end-to-end thực tế trong lượt này. Các kiểm tra trước đó vẫn có giá trị trong phạm vi đã ghi, nhưng không đủ để tuyên bố mọi tính năng sẵn sàng production.

Thứ tự đề xuất: sửa P1 → phục hồi tải/chuyển trang/bảng tin → primitive form và hồ sơ mobile → kiểm tra với backend thật. Luyện tập, kỳ thi và lịch sử vẫn chưa có toàn bộ luồng làm bài/chấm/lưu kết quả.

Sau khi ổn định, ưu tiên một luồng học tập có ích: **lưu tài liệu + góc tài liệu đã lưu**, sau đó **luyện nhanh theo chủ đề → giải thích → ôn câu sai → lịch sử**, rồi **theo dõi môn học/thông báo mới**. Luyện tập cần API lượt làm bài và chấm điểm bảo vệ đáp án; không đưa thẳng API ngân hàng câu hỏi quản trị cho sinh viên.

## Cập nhật: màn chờ với logo trường

Đã xử lý phần loading mã trang trong bảng rà soát bổ sung; các lỗi phiên đăng nhập, nhập PDF, tải tài liệu, bảng tin và form vẫn chưa được sửa trong đợt này.

- `index.html` hiển thị logo trường, nét bút và tiến độ chuẩn bị. Theo yêu cầu mới, màn chờ giữ tối thiểu 1,5 giây, đợi route đầu, các query đang tải lần đầu, font và video đang dùng trước khi lên 100%; mạng chậm tiếp tục chờ, không có deadline tự bỏ qua. Tiến độ là các bước chuẩn bị, không phải phần trăm byte của toàn website.
- Khi lên 100%, giữ 250ms rồi dùng GSAP: logo/chữ lùi nhẹ, hai lớp nền kéo sang hai bên trong khoảng một giây để mở trang. Chỉ mở tương tác sau khi hiệu ứng kết thúc. Giảm chuyển động dùng fade 120ms. Không phát lại màn mở website toàn màn hình khi đổi route trong SPA.
- Theme được đọc trước khi React tải từ cùng khóa `olympic-theme` của store; mặc định theo thiết bị. Giữ font và assets hiện có. Thêm `gsap` theo yêu cầu; chunk chính hiện khoảng 846 kB, gzip 274 kB (GSAP tăng khoảng 27 kB gzip so với trước hiệu ứng).
- Logo nguồn `public/icons.svg` có canvas 1095 × 1095 nhưng phần hình đo bằng SVG `getBBox()` là x105, y188, khoảng 862 × 686. Chỉ căn bỏ khoảng trắng tại màn chờ, không sửa file gốc hoặc logo navigation. Phần hình hiển thị mobile 120 × 96px, desktop tối đa 148 × 118px; màn chờ route 96 × 76px. Theo yêu cầu mới, bỏ nền giấy sáng ở mode tối: logo nằm trực tiếp trên nền navy, tăng độ sáng nhẹ bằng CSS để còn rõ; giữ nguyên tỉ lệ và file nguồn.
- Các route lazy dùng chung `RouteSuspense` và `PageLoading`. Fallback tham gia trạng thái chuẩn bị của startup cho đến khi trang đầu được render. Chuyển pathname hiển thị trạng thái chờ của trang mới; thay query/filter giữ nguyên state trang.
- Chỉ video theme hiện tại được tải đầy đủ một lần, đo byte qua stream và dùng lại Blob URL khi phát hoặc mount lại cảnh. Video tải chậm giữ tiến độ dưới 100%; video tải lỗi dùng poster dự phòng và cho vào trang. Mobile auth và chế độ giảm chuyển động vẫn không tải video.
- Có chỉ dẫn tải lại sau 12 giây nếu chờ lâu; liên kết giữ nguyên URL/query, không tự nhảy qua loader. JavaScript bị tắt có hướng dẫn rõ.
- Build và lint qua (các cảnh báo cũ về Fast Refresh/hooks và chunk lớn vẫn còn). Browser production preview kiểm chứng 320/390/1440px, sáng/tối: 100% chỉ sau tối thiểu 1,5 giây; root còn khóa tại 100% và trong lúc GSAP mở nền, sau đó được mở tương tác. Ép video, chunk trang và query đầu chậm đều giữ loader; video dùng lại bản đã tải, không request lần hai; poster hoạt động khi video lỗi. Kiểm tra giảm chuyển động, mobile auth và development StrictMode qua; không có lỗi runtime trong các tình huống hoàn tất. Các kiểm tra bootstrap/bundle lỗi/JavaScript tắt ở lượt trước vẫn áp dụng cho markup ban đầu.

## Cập nhật: icon tài khoản và nav desktop

- Đăng nhập/đăng ký vốn không có icon trang trí trước tiêu đề. Đã bỏ icon chìa khóa ở form quên mật khẩu và icon ổ khóa ở form đặt lại mật khẩu để bốn form cùng cách trình bày. Giữ icon ở thông báo đã gửi email, xác thực thành công/lỗi và liên kết đặt lại không hợp lệ vì chúng biểu thị trạng thái.
- Browser với API mock kiểm chứng 320/390/1440px, sáng/tối: đi qua các form, không có icon trang trí trước tiêu đề, gửi khôi phục vẫn tới trạng thái kiểm tra hộp thư có icon, không tràn ngang. Logo preload tối không còn pseudo-element tạo nền sáng. Build/lint qua, không có lỗi runtime trong kiểm tra này.
- Đã áp dụng nav nổi trên các trang công khai ở desktop từ 1280px: tối đa 1200px, cách mép trên 16px, cao 60px và thu nhẹ còn 56px khi cuộn. Ba cột giữ menu ở đúng tâm viewport, độc lập với độ rộng nhóm thao tác tài khoản. Dùng màu theme hiện có, nền kính nhẹ và logo trường được căn bỏ khoảng trắng ở riêng header; giữ font và nguồn logo.
- Menu gồm Môn học/Tài liệu/Bảng tin/Tiện ích; logo dẫn về trang chủ. Vạch chọn trượt theo route, nhận cả trang chi tiết và phòng học; trang không thuộc bốn nhóm thì ẩn vạch. Giảm chuyển động tắt hiệu ứng. CTA duy nhất “Vào góc học tập” mở đăng nhập và giữ đường quay lại gồm query/hash; người đã đăng nhập mở dashboard theo vai trò, giảng viên/admin dùng nhãn “Không gian quản lý” và vẫn có menu avatar.
- Các trang công khai ngoài trang chủ chừa khoảng phía trên cho nav cố định; hero đã có khoảng chừa riêng. Dưới 1280px giữ header/menu nhóm và hai nút đăng nhập/đăng ký trong sheet như trước.
- Kiểm chứng bằng Chromium trên production preview, API mock: guest 1280/1440/1920px và student/lecturer/admin 1440px đều qua ở sáng/tối; đo tâm menu, kích thước nav, khoảng chừa nội dung và không chồng nhóm thao tác. Kiểm tra cuộn, route chi tiết/alias phòng học, history, CTA theo vai trò, đường quay lại có query/hash, keyboard và giảm chuyển động đều qua. Mobile/tablet 320/390/1024/1279px qua menu nhóm, focus/Escape, chuyển route, đổi breakpoint và không tràn ngang. Không có lỗi runtime; build/lint qua với các cảnh báo cũ về chunk lớn, Fast Refresh và dependency hook. Chưa kiểm chứng backend thật trong lượt này.

## Cập nhật 02/10/2026: phiên đăng nhập, bảng tin, phòng học và GPA

Theo phạm vi đã thống nhất, không sửa phục hồi nhập PDF hoặc giới hạn upload PDF trong đợt này. Các mục PDF vẫn ngoài phạm vi; hủy tải tài liệu và hồ sơ/form được xử lý trong cập nhật cuối bên dưới.

- Phiên đăng nhập: refresh dùng chung request, timeout 15 giây. Refresh 401/403 xóa token và dữ liệu cache, cập nhật người dùng về null để tránh vòng chuyển từ đăng nhập về dashboard. Lỗi mạng/timeout/server giữ phiên và cho thử lại. Kết quả refresh cũ không khôi phục lần đã đăng xuất hoặc ghi đè lần đăng nhập mới. Query đang có observer được xóa dữ liệu và chuyển sang lỗi tại chỗ, tránh màn danh sách chờ mãi do xóa query khi đang tải. Đường quay lại sau đăng nhập tiếp tục dùng cơ chế hiện có.
- Bảng tin: các liên kết bài viết giữ URL danh sách gồm từ khóa, loại bài, trang và hash. Breadcrumb/liên kết quay lại dùng React Router, không tải lại document. Chi tiết phân biệt 404 với lỗi kết nối/server có nút thử lại; bài quá hạn ghi “Đã hết hạn”. Hiệu ứng chi tiết và mục lục tôn trọng giảm chuyển động.
- Phòng học: thêm chuyển quyền cho thành viên đang online, có chọn người nhận và xác nhận rõ quyền quản lý. Chủ cũ vẫn học trong phòng; không reset nhạc, lịch hoặc thời gian. API kiểm tra quyền dưới khóa, tài khoản hoạt động và giới hạn 3 phòng của người nhận. Mạng trở lại/tab hiện lại sẽ đồng bộ; trạng thái chưa đồng bộ tạm ngừng đếm ngược và thao tác quản lý. Màn phân biệt thời gian đã ghi nhận với gián đoạn; lease hết hạn cần tham gia lại.
- GPA: thêm kế hoạch mục tiêu trên hệ 4/10, tính trung bình tối thiểu cần đạt từ GPA hiện tại và tín chỉ đã tính/còn lại, báo mục tiêu không khả thi và GPA tối đa. Chấp nhận dấu phẩy/dấu chấm; kiểm tra giá trị và giới hạn số, xử lý không còn tín chỉ. Bản nháp lưu riêng trên trình duyệt; không tự áp dụng quy định học lại/quy đổi của trường.

Kiểm chứng: 31 kiểm thử web đạt; build đạt, lint 0 lỗi/29 cảnh báo cũ; 18 kiểm thử API phòng học đạt với PostgreSQL Testcontainers, gồm chuyển quyền đồng thời, kiểm tra quyền/online/tài khoản và giới hạn phòng. Bộ API toàn repository ở baseline còn hai lỗi khởi tạo context do thiếu Google OAuth client ID; không chạy lại hoặc sửa cấu hình OAuth trong đợt này.

Chromium dùng production preview tại `127.0.0.1:4175`, API và YouTube giả lập: GPA 320/390/1440px sáng/tối giữ bản nháp và không tràn ngang; bảng tin giữ URL mà không reload, lỗi 503 thử lại được và 404 hiển thị đúng; refresh hết hạn mở được đăng nhập, lỗi tạm thời giữ tài khoản, thành công dùng token mới. Phòng học kiểm tra chuyển quyền/hộp thoại Escape, mất mạng rồi kết nối lại, lease hết hạn cần bấm tham gia, và đồng bộ khi tab hiện lại. Kiểm tra giao diện phòng ở 320/1440px sáng/tối và bảng tin mobile tối với giảm chuyển động. Không có lỗi runtime trong các tình huống hoàn tất. Đây chưa phải xác nhận end-to-end với backend/YouTube thật trên điện thoại khóa màn hình.

## Cập nhật 02/10/2026: cảnh phòng học 2D

- Trang phòng thêm cảnh SVG gồm cửa sổ, kệ sách, bàn/ghế và nhân vật có avatar/tên phía trên. Các mẫu nhân vật có màu áo/tóc ổn định theo user ID; tên/avatar lấy từ thành viên thật trong snapshot. API bổ sung `members[].avatarUrl` qua storage service và fetch user/avatar cùng truy vấn; ảnh chưa có hoặc lỗi dùng chữ cái tên.
- Nhân vật có chuyển động xuất hiện/rời chỗ, viết/đọc khi tập trung và vươn vai khi nghỉ. Offline hoặc chưa đồng bộ dừng động tác, đổi nhãn; animation biểu thị nhịp phòng, không xác minh hoạt động học của từng người. Chỗ ngồi không đổi khi snapshot đổi thứ tự; người mới dùng ghế trống hoặc thêm bàn. Cảnh chia tối đa 12 bàn mỗi nhóm, hỗ trợ 50 thành viên và hai cột trên mobile.
- Bấm nhân vật mở tên, vai trò, trạng thái và phút server đã ghi nhận. Escape đóng hộp thoại, trả focus về đúng chỗ; tên dài xuống dòng trong chi tiết. Giảm chuyển động tắt cả động tác lặp và hiệu ứng vào/rời. Không thêm thư viện hoặc tải sprite/video.

Kiểm chứng: 34 test web đạt, build đạt, lint 0 lỗi/29 cảnh báo cũ; 19 test API phòng học đạt, gồm test mới cho URL avatar riêng và null khi không có avatar. Browser Chromium production preview với API/YouTube giả lập kiểm tra 320/390/1440px sáng/tối, avatar ảnh hợp lệ/ảnh lỗi, ghế ổn định qua reorder, hộp thoại và trả focus, giảm chuyển động; kiểm tra thêm vào/rời chỗ, đổi phase, offline, phòng trống, 50 người và tên dài trên mobile. Không tràn ngang hoặc có lỗi runtime trong các tình huống này. Avatar API được kiểm chứng bằng PostgreSQL Testcontainers và URI storage giả lập; chưa chạy luồng avatar/YouTube end-to-end với dịch vụ thật.

## Cập nhật 02/10/2026: chỉnh giờ, chuông và hiệu ứng chuyển nhịp

- Chủ phòng chỉnh phút tập trung/nghỉ ngắn/nghỉ dài, có ba mẫu và giới hạn trùng API. Hộp thoại báo rõ đồng hồ chung bắt đầu lại; nút “Bắt đầu nhịp mới” áp dụng cho cả phòng, giữ thời gian đã ghi nhận, thành viên và nhạc. Phiên bản nhịp chống lệnh trùng/đồng thời; hộp thoại cũ yêu cầu lấy lại thời lượng.
- API thêm PATCH rhythm và Flyway V11 cho mốc timeline/phiên bản. Chốt phần tập trung hợp lệ trước đổi giờ, không gia hạn presence/lease của thành viên khác, không cộng cho người offline hoặc cộng trùng qua heartbeat sau đổi. Lịch phòng hiện có giữ nguyên khi migration; cần cập nhật mọi instance API trước web mới.
- Chuông ba nốt dùng Web Audio, bật/tắt/thử riêng từng thiết bị. Chỉ phát sau thao tác bật âm thanh, cần bật lại sau reload. Hết nhịp học/nghỉ hiện thông báo 7 giây có nút đóng, tia màu và ánh sáng nhẹ. Khử trùng countdown/polling, không coi đặt lại nhịp là hoàn thành, không phát bù khi offline/tab ẩn hoặc quá muộn. Giảm chuyển động giữ thông báo tĩnh.

Kiểm chứng: 39 test web đạt; build đạt, lint 0 lỗi/29 cảnh báo cũ. 25 test API phòng học đạt với PostgreSQL Testcontainers, gồm quyền, HTTP validation, giữ nhạc/thời gian, lease offline và reset đồng thời/trùng phiên bản. Chromium trên production preview với API/YouTube giả lập kiểm tra 320/390/1440px sáng/tối, chỉnh giờ/cancel/giới hạn, hai tài khoản nhận nhịp mới và hộp thoại stale. Web Audio thật tạo ba nốt khi bật/thử và đúng một lần mỗi ranh giới, polling không phát trùng, tắt chuông vẫn giữ hiệu ứng; offline rồi kết nối lại không reo bù, reload cần thao tác âm thanh mới. Mobile tối giảm chuyển động giữ thông báo, không animation/tràn ngang. Không có lỗi runtime trong các tình huống hoàn tất. Chưa kiểm chứng end-to-end với API/YouTube thật hoặc âm thanh trên điện thoại khóa màn hình.

## Cập nhật 02/10/2026: hủy tải tài liệu, nhãn form và hồ sơ mobile

Đã xử lý ba mục P2 tương ứng trong bảng rà soát. Phần phục hồi nhập PDF và giới hạn upload tiếp tục ngoài phạm vi.

- Tải tài liệu: AbortSignal đi qua cả request lấy link với shared API client và request blob không có credentials tới storage. Timeout link giữ 15 giây, file 2 phút; có trạng thái lỗi và Thử tải lại. Nút Hủy tải, Escape/đóng hoặc unmount đều hủy request; tài liệu khác có vòng đời riêng. Dọn timer tự đóng sau thành công, bỏ timer reset trễ và chặn progress/success đến sau khi hủy. Trả focus về nút mở. Không hiện phần trăm khi chưa biết tổng byte; truyền giá trị thực xuống primitive Progress để accessibility nhận đúng tiến độ.
- Nhãn form: CSS dùng `:placeholder-shown`/`:has` trên giá trị native, không phụ thuộc change/blur hoặc state đồng bộ từ ref. Nhận dữ liệu ban đầu, setValue/reset, giá trị đổi không phát event và trạng thái tự điền; giữ label association, ref RHF, màu focus/lỗi, nút xem mật khẩu và giảm chuyển động. Không thêm polling/listener toàn trang.
- Hồ sơ: ô email/username có cột co được và ngắt chuỗi dài; thêm khoảng nội dung phù hợp ở 320px. Lưu thành công lấy tên server trả về làm giá trị/default mới, reset dirty state; khóa ô tên trong lúc lưu. Lưu thất bại giữ bản sửa và nút thử lại.

Kiểm chứng: 39 test web hồi quy đạt, build đạt, lint 0 lỗi/29 cảnh báo cũ. Chromium production preview tại `127.0.0.1:4175`, API/storage giả lập nhưng dùng Axios/XHR và download thật của trình duyệt: hồ sơ 320/390/1440px sáng/tối với username 48 ký tự/email dài, nhãn dữ liệu sẵn, tên server chuẩn hóa và baseline dirty sau lưu; lưu lỗi/thử lại. Form danh mục kiểm tra reset từ dữ liệu có sẵn sang rỗng và mã tự sinh bằng setValue; đổi giá trị native không có event, ô rỗng, màu nhãn focus/lỗi và xem mật khẩu đăng nhập đều qua. Hủy cả request link/file ghi nhận requestfailed, phản hồi cũ không tải file hoặc đổi dialog mới; thành công giữ tên file/tiến độ 100% và timer không đóng dialog kế tiếp. Ép XHR timeout bằng rút ngắn riêng timeout trong fixture, xác nhận cấu hình file vẫn 120.000ms; kiểm tra 503 link/file, retry, tự đóng sau thành công, focus và mobile tối. Không tràn ngang hoặc có lỗi runtime trong các tình huống hoàn tất. Chưa kiểm chứng storage/backend thật trong lượt này; không thay đổi API contract hoặc thêm dependency.

## Cập nhật 02/10/2026: profile và giao diện chung

Dùng hướng thiết kế trong [quy chuẩn giao diện](../architecture/web-ui.md): giữ bảng màu xanh và font Be Vietnam Pro hiện có, tiêu đề chức năng thống nhất, bỏ các khung kính/shadow không phục vụ nội dung. Profile là màn tham chiếu; dữ liệu vẫn lấy từ tài khoản/API.

- Profile desktop có avatar/tên/vai trò ở trái, form thông tin và bảo mật ở phải. Mobile thu gọn avatar cạnh tên, xếp một cột. Email/username dài xuống dòng; ảnh lỗi có chữ cái thay thế. Giữ xem trước/lưu/hủy/xóa ảnh và reset tên theo phản hồi server. Hộp thoại mật khẩu xóa nội dung khi đóng, gợi ý autofill đúng, khóa input khi gửi và trả focus về nút mở.
- Dùng chung PageHeader, PageSection, page-shell và tokens cho dashboard theo vai trò, màn quản lý tài liệu/bài viết/người dùng/danh mục/câu hỏi, môn học, bảng tin, toolkit và trang hướng dẫn. Trang chi tiết dùng chuẩn chữ chung và giữ vùng đọc phù hợp. Nút chính dùng màu primary, nút mặc định/input thường 44px; các kích thước nhỏ và ô nhãn nổi giữ vai trò riêng.
- Auth dùng cùng chuẩn chữ và màu thao tác, giữ cảnh desktop và vở mobile. Phòng giữ nhân vật SVG, nhịp/chuông/nhạc; tiêu đề và điều khiển thống nhất với toolkit. Trang giới thiệu dẫn tới các công cụ đang có. Ô chọn PDF ẩn dùng native input để tránh tràn ngang; không sửa luồng phục hồi/import hoặc giới hạn upload.

Kiểm chứng: production build đạt; 39 test web hồi quy đạt; lint 0 lỗi/29 cảnh báo cũ; diff check sạch. Chromium với API/storage giả lập kiểm tra 21 màn ở 320/1440px sáng/tối, 5 route auth ở cả hai kích thước/theme và dashboard/profile cho student/lecturer ở 1024px. Tiêu đề chức năng cùng font/weight/scale, không tràn viewport; giảm chuyển động bật trong các lượt quét, kiểm tra thêm desktop với motion bình thường. Screenshot được xem lại; từ đó thu gọn avatar mobile và sửa input ẩn.

Kiểm tra hành vi: hồ sơ với dữ liệu dài ở 320/390/1440px, lưu chuẩn hóa/lỗi/thử lại; avatar xem trước/hủy/upload multipart/xóa/hủy xóa và ảnh lỗi; đổi mật khẩu validation/lỗi/thử lại, Escape xóa nội dung và trả focus. Kiểm tra thêm home/404, điều hướng môn tới bộ lọc tài liệu, GPA, URL tab, hộp thoại chỉnh giờ ở 390/1024/1440px. Luồng hủy/tải/timeout/retry tài liệu, nhãn native/reset/mã tự sinh và xem mật khẩu đăng nhập vẫn qua. Không có lỗi runtime trong các tình huống hoàn tất. Chưa kiểm chứng backend, storage hoặc YouTube thật trong lượt thiết kế này; API contract và dependency web giữ nguyên.

## Cập nhật 02/10/2026: trang chủ và nền động

- Thêm lối vào phòng học chung/GPA dưới tìm kiếm, đổi tab Toolkit thành Tiện ích. Bảng tin mới nhất ghép ba NEWS/BLOG theo ngày đăng, thông báo nằm riêng trong bàn học. Bài không có thumbnail dùng hàng văn bản; ảnh lỗi thu lại thành hàng không ảnh. Thu khoảng trống trước bảng tin. Footer public mở đủ nhóm trên desktop và thu/mở bằng details trên mobile, hỗ trợ bàn phím.
- Nền động mặc định bật cả mobile/iPhone; nút cạnh giao diện nhớ lựa chọn. Ánh sáng xanh chỉ trong hero, trôi chậm 32 giây bằng transform, dừng khi khuất hoặc tab ẩn. Tắt nền/giảm chuyển động giữ poster và không tải video ở lần vào đó. Video dùng cơ chế muted/playsInline/fallback sẵn có; lựa chọn trang chủ không thay đổi cảnh auth. Nếu trình duyệt chặn localStorage, nút vẫn đổi được trong phiên.
- Rà soát screenshot sáng/tối ở 390/1440px: giữ tìm kiếm làm thao tác chính, ánh sáng nhẹ sau phần giới thiệu; bảng tin cùng nhịp chữ/màu chung, không có khung ảnh rỗng. Footer mobile thu gọn, không kéo dài trang bằng các nhóm luôn mở.

Kiểm chứng: build đạt; 39 test web hồi quy đạt; lint 0 lỗi/29 cảnh báo cũ; diff check sạch. Chromium production preview với API giả lập và MP4 thật kiểm tra 320/390/1024/1280/1440px sáng/tối: mặc định động, bật/tắt/reload, video thực sự phát/dừng khi cuộn, giảm chuyển động cập nhật trực tiếp, không tải video khi bắt đầu tĩnh; liên kết phòng/GPA/tìm kiếm; thứ tự và loại bài, tab thông báo, lỗi một phần giữ bài còn lại/thử lại và bảng tin rỗng. Kiểm tra thêm footer trên môn học/bảng tin/tài liệu/toolkit, bàn phím và storage bị chặn ở 390/1440px. Không tràn ngang hoặc có lỗi runtime trong các tình huống hoàn tất.

WebKit Linux giả lập iPhone 390px và desktop 1440px qua mặc định động, bật/tắt/reload, ambient dừng khi cuộn, footer mobile/bàn phím/các route public, giảm chuyển động cập nhật trực tiếp và storage bị chặn. Autoplay bị chặn giữ poster đã giải mã. Engine kiểm thử báo lỗi giải mã MP4, nên chỉ xác nhận fallback ảnh tĩnh trên WebKit, không xác nhận phát video trên Safari/iPhone thật. Chromium đã phát/dừng MP4 thật. Chưa kiểm chứng backend thật hoặc thiết bị iPhone trong lượt này.

## Cập nhật 02/10/2026: nav rõ trạng thái và ba vùng trang chủ

- Theo yêu cầu mới, nền động trang chủ bỏ tự tắt theo Giảm chuyển động của thiết bị. Mặc định bật, nút thủ công giữ quyền tắt và nhớ lựa chọn. CinematicScene có tùy chọn respectReducedMotion, mặc định true; chỉ home truyền false để các màn auth tiếp tục tôn trọng thiết bị. CSS giảm chuyển động của cảnh cũng dùng đúng phạm vi. Video/ambient vẫn dừng khi khuất hoặc tab ẩn.
- Nav desktop có đủ năm mục, gồm Trang chủ, đánh dấu trang đang mở bằng nền accent và giữ khớp route chi tiết/alias. Giữ chiều cao khi cuộn, bỏ blur, rút CTA thành Đăng nhập/Góc học tập/Quản lý và căn logo/menu/thao tác không chồng nhau. Mobile gom giao diện tối/nền động vào Tùy chọn hiển thị, còn hai nút cho khách hoặc ba nút khi đăng nhập; menu điều hướng giữ nhóm/quyền/đích đăng nhập.
- Tách bàn học khỏi hero thành section có tiêu đề Bàn học của bạn, mô tả, nền và đường ranh riêng. Ba vùng tìm tài liệu/cảnh, bàn học và bảng tin dùng cùng gutter. Cấp tiêu đề trong tab thành h3 dưới tiêu đề vùng h2. Thu chiều cao tối thiểu notebook mobile; dữ liệu API, tab và liên kết công cụ giữ nguyên.

Kiểm chứng: build đạt, 39 test web hồi quy đạt, lint 0 lỗi/29 cảnh báo cũ và diff check sạch. Chromium production preview với API giả lập và MP4 thật kiểm tra 320/390/768/1024/1279/1280/1440/1920px sáng/tối: nền vẫn phát khi OS báo reduce, CSS video hiện và ánh sáng chạy, bật/tắt/reload không tải video khi đã tắt, đổi media preference không ghi đè lựa chọn. Kiểm tra ranh giới/nền các vùng, tab, nav căn giữa/không chồng/tràn, mở sheet và đổi route/active, đổi theme trong menu và Escape trả focus; khách, student, lecturer/admin và CTA đúng ở 1280px. Auth desktop khi reduce không tải video, chuyển lại no-preference phát bình thường. Các screenshot 390/1440px sáng/tối được xem lại, giữ ranh giới rõ và cảnh làm điểm nhấn.

WebKit Linux giả lập iPhone 390px và desktop 1440px sáng/tối qua manual motion dù OS reduce, nút/menu/theme/reload, ranh vùng, nav, GPA route và poster khi giải mã video lỗi. Auth vẫn không tải video với reduce. Không có lỗi runtime trong các lượt hoàn tất. Đây chưa phải kiểm chứng phát MP4 trên Safari/iPhone thật; engine WebKit Linux vẫn có lỗi giải mã như lượt trước. Không đổi API/dependency hoặc luồng PDF.

## Cập nhật 02/10/2026: nền chuyển động, menu mobile và thẻ tin đồng bộ

- Nền hero có hai vùng sáng mềm và ba đường cong trôi chậm 24–30 giây bằng transform, dùng mask để mép hòa vào nền. Mặc định bật, công tắc thủ công nhớ lựa chọn; home vẫn theo lựa chọn riêng dù OS báo reduce. Video và ba animation dừng khi cuộn khỏi vùng hoặc tab ẩn. Không thêm video, canvas, ảnh hay dependency.
- Avatar public dùng khung 44px ngang các nút thao tác; không đổi avatar sidebar. Mobile dùng thanh nổi logo/avatar/Menu, bỏ nút hiển thị riêng. Menu mở từ dưới lên, công tắc giao diện tối/nền động nằm trên các nhóm điều hướng theo quyền. Nội dung dài cuộn bên trong, nút đóng và footer đăng nhập luôn truy cập được; hỗ trợ safe area.
- Blog/Tin tức/Thông báo dùng cùng màu chữ/nền/viền, phân biệt bằng nhãn. Trang chủ có ba thẻ ngang desktop và một cột mobile; bảng tin dùng thẻ có metadata, tiêu đề, tóm tắt và ảnh gọn khi có. Cả phần đệm thẻ mở chi tiết, giữ đường quay lại gồm bộ lọc/trang/hash. Ảnh lỗi được bỏ; URL ảnh mới vẫn có thể hiển thị.
- Rà soát ảnh 390px sáng và 1440px tối cùng menu mobile: avatar cân với thao tác, menu giảm số nút trên thanh, thẻ tin cùng nhịp và tông màu. Sau rà soát đã làm mềm mép ambient và bỏ vòng focus kép của header.

Kiểm chứng: pnpm build đạt; pnpm lint 0 lỗi/29 cảnh báo cũ; diff check sạch. Chromium và WebKit production preview với API giả lập kiểm tra 320/390/1024/1280/1440px sáng/tối, OS reduce: chuyển động thực sự đổi transform, bật/tắt/reload, không tải MP4 khi đã tắt, dừng/resume khi cuộn hoặc mô phỏng tab ẩn. Kiểm tra avatar ảnh thật/khung 44px, menu/công tắc/theme/Escape trả focus, menu khách 320×360px và menu quản trị dài, nhãn bài cùng computed color/background/border, bố cục thẻ, ảnh lỗi, điều hướng/quay lại và lỗi một phần/thử lại. Kiểm tra riêng bấm vùng đệm thẻ ở 390/1440px trên cả hai engine sau build cuối. Không tràn ngang hoặc có lỗi runtime trong các tình huống hoàn tất.

WebKit Linux vẫn lỗi giải mã MP4 và đã xác nhận fallback poster; chuyển động nền CSS chạy được ở cả hai engine. Chromium phát MP4 thật. Chưa kiểm chứng Safari/iPhone thật hoặc backend thật. Không đổi API, dependency, luồng PDF.

## Cập nhật 02/10/2026: khung avatar lưu ở backend, ảnh gốc giữ nguyên

- Avatar nav trở lại cover lấp đầy vòng tròn 44px, bỏ phần đệm làm ảnh nhỏ. Hồ sơ có Chỉnh ảnh đại diện: kéo chuột/cảm ứng, phím mũi tên/Shift, Độ phóng 1–3× và Đặt lại, xem trước/hủy trước khi lưu. Hộp thoại dùng token/font hồ sơ; màn thấp dùng flex không co các phần và cuộn để ảnh không che nút.
- Theo yêu cầu, không tạo ảnh đã cắt: file gốc, tên, định dạng và bytes được giữ nguyên. Upload multipart gửi file cùng part JSON crop. Backend lưu x/y căn ảnh 0–1 và zoom 1–3 qua embeddable user/migration V12, trả avatarCrop cùng URL gốc. PATCH /users/me/avatar/crop chỉnh lại riêng khung, không upload/delete storage hoặc đổi file/URL. Xóa avatar xóa metadata.
- Frontend dùng AvatarImage chung để áp dụng object-position/scale/transform-origin trong vùng tròn. Nav, hồ sơ, hover card, admin, người đăng tài liệu/bài viết và thành viên phòng học nhận cùng metadata. Chỉnh lại dùng ảnh gốc và khung đã lưu; không cần fetch ảnh khác origin hoặc canvas. Client cũ/null metadata dùng cover giữa, zoom 1; upload cũ không gửi crop vẫn được.
- Hủy hoặc lỗi upload/crop giữ ảnh đã lưu; bản xem trước còn để thử lại. Object URL được dọn. Upload storage mới thất bại không xóa file cũ; lựa chọn ảnh hỏng/định dạng/dung lượng vẫn được kiểm tra.

Kiểm chứng: pnpm build đạt; pnpm lint 0 lỗi/29 cảnh báo cũ; toàn bộ 43 test web đạt, gồm 4 test hình học/round trip metadata và công thức CSS. Backend: 7 test service/controller đạt (gửi nguyên file, crop độc lập, upload lỗi, xóa metadata, mapper auth, multipart tương thích/validation), 2 integration test avatar PostgreSQL/Flyway/JPA đạt với reload metadata/legacy/xóa và 16 test phòng học đạt với metadata thành viên. Testcontainers thực sự chạy, không skip. V12 còn được kiểm tra trên bảng tạm PostgreSQL, cả null/giá trị hợp lệ/partial/out-of-range/NaN, rollback toàn bộ và không áp dụng vào DB dev.

Chromium/WebKit production preview với API giả lập: 390px sáng/tối và 1440px tối, so bytes/name/type file upload với file đã chọn, JSON metadata riêng, preview trùng vùng chọn qua pixel screenshot, chỉnh lại/đặt lại từ ảnh gốc, lưu/reload giữ khung, PATCH chỉ đổi metadata và nav hiển thị cùng vùng ảnh. 320px kiểm tra ảnh dọc, drag chuột (Chromium thêm touch event), upload/crop lỗi/thử lại, màn 320×360px bấm được xác nhận, hủy preview không gửi request và ảnh hỏng không lưu được. Kiểm tra thêm cả hai engine: bài viết đã cache refetch avatar tác giả sau khi sửa khung trong hồ sơ, không upload lại; slider phóng/thu giữ tâm vùng ảnh đã chọn và lưu lại đúng metadata ban đầu. Không tràn ngang hoặc lỗi runtime trong các lượt hoàn tất. Screenshot ảnh thật, sáng/tối và màn thấp đã được xem lại.

API cần chạy migration V12 trước frontend mới. Storage Cloudinary và iPhone thật chưa được kiểm chứng trực tiếp; browser dùng storage/API giả lập, backend dùng PostgreSQL thật trong container và mock storage. Không đổi dependency hoặc luồng PDF.

## Xác thực đăng ký bằng OTP — 02/10/2026

Đăng ký mới nhập OTP 6 số ngay trên màn đăng ký, có email hiển thị riêng, sửa email, gửi lại với cooldown và tiếp tục xác thực bằng email/username + mật khẩu khi mất phiên. sessionStorage chỉ giữ challenge có thời hạn, không giữ OTP/mật khẩu; storage bị chặn vẫn dùng được trong tab hiện tại. Sai mã/hết hạn/khóa/phiên hết hạn có hướng dẫn tiếp tục. Đăng nhập PENDING và link cũ lỗi có lối vào phục hồi; đích quay lại sau đăng nhập được giữ. Link cũ chỉ gửi một request trong StrictMode.

API giữ user PENDING đến khi mã đúng; OTP 10 phút, tối đa 5 lần sai, cooldown 60 giây, giới hạn chia sẻ theo user/IP trong PostgreSQL. Sửa email chỉ dùng phiên đăng ký tương ứng; mã/link cũ bị hủy và không đổi user ID. Nginx thay header IP do client gửi, chống vượt giới hạn bằng forwarded headers. API cần V13; contract/vận hành ở [registration-otp.md](../architecture/registration-otp.md).

Kiểm tra: 15 PostgreSQL integration + 3 controller + 2 JWT tests qua, không skip; 47 Node web tests qua; build thành công, lint 0 lỗi/29 cảnh báo có sẵn; nginx -t hợp lệ. Chromium/WebKit qua ở 1440/390/320px, sáng/tối, giảm chuyển động, sửa email trùng/thành công, tải lại, resend, mã sai/khóa, chống gửi verify trùng, phục hồi PENDING/phiên hết hạn và storage bị chặn. Kiểm tra trình duyệt dùng API mock; StrictMode link cũ chạy trên Vite dev riêng. Chưa chứng minh SMTP production giao thư thật và chưa triển khai runtime API mới.
