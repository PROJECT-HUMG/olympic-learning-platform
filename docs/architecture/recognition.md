# Recognition: Honors, achievements and privacy

[RecognitionServiceImpl](../../apps/api/src/main/java/me/nghlong3004/olympic/recognition/service/impl/RecognitionServiceImpl.java), [public controller](../../apps/api/src/main/java/me/nghlong3004/olympic/recognition/controller/RecognitionController.java), [admin controller](../../apps/api/src/main/java/me/nghlong3004/olympic/recognition/controller/AdminRecognitionController.java) and [requests/DTOs](../../apps/api/src/main/java/me/nghlong3004/olympic/recognition) own exact endpoints/fields. [Named features](../README.md#profile) and [identity/UI owners](../ui/owners/identity-and-recognition.md) connect routes, return navigation, upload and tests.

Honors albums are admin-edited memories with ordered photos and registered/historical attribution: drafts are admin-only, published albums are public, and albums never create achievements or award points. Academic achievements are separate evidence-backed submissions; only currently APPROVED records contribute points. Reapproval does not duplicate points; revocation removes them.

## Quy tắc điểm hiện có

| Nhóm | Nhất | Nhì | Ba | Khuyến khích | Tham gia |
| --- | ---: | ---: | ---: | ---: | ---: |
| Olympic toàn quốc (`OLYMPIC_NATIONAL`) | 10 | 9 | 8 | 7 | 6 |
| Olympic cấp trường (`OLYMPIC_SCHOOL`) | 5 | 4 | 3 | 2 | 2 |
| NCKH cấp Bộ (`RESEARCH_MINISTRY`) | 8 | 7 | 6 | 5 | Không áp dụng |
| NCKH cấp trường (`RESEARCH_SCHOOL`) | 6 | 5 | 4 | 3 | 3 |
| NCKH giải thưởng khác (`RESEARCH_OTHER`) | 6 | 5 | 4 | 3 | Không áp dụng |

Điểm giải thưởng và điểm tham gia được cộng nếu người gửi chọn tham gia, kể cả khi đã có giải. Ví dụ Olympic toàn quốc giải Nhất và tham gia được 16 điểm; chỉ tham gia được 6 điểm. Các hồ sơ cộng độc lập, không áp dụng chỉ lấy giải cao nhất hoặc trần 10 điểm. Lựa chọn tham gia ở nhóm chưa có mức điểm bị từ chối; hồ sơ phải có giải hoặc tham gia hợp lệ.

Điểm quốc tế chưa có quy tắc nên chưa hỗ trợ ở form thành tích. Phạm vi `INTERNATIONAL` của bài vinh danh vẫn có thể ghi nhận kỷ niệm và không cộng điểm. Các nhóm hoạt động khác ngoài học thuật được để lại cho đợt sau. Điểm trên nền tảng là tổng theo quy tắc này; không thay thế kết quả đánh giá rèn luyện chính thức của trường.

## Duyệt và quyền riêng tư

- Public profiles require an active, nondeleted identity and return only approved+visible records. The count is records, not prizes; `publicPoints` sums their award+participation points. Rankings are separate: active STUDENT, explicit opt-in, all approved records including private ones, optional achieved-date year, server ties `1,1,3` with stable ID order. Changing visibility does not redefine confirmed points; opting out removes the row without deleting records.
- [V24](../../apps/api/src/main/resources/db/migration/V24__public_achievement_defaults.sql) changes the default to true and sets **every existing false flag true**, including pending/rejected/revoked/inactive records, advancing changed versions/timestamps. Only approved records of active identities become anonymously readable; review/score/files/consent do not change. This is one-time publication, not a trigger: owners can opt out afterward. Do not infer whether live Flyway ran from local docs. Never rewrite V24 or guess the formerly private set on rollback; reversal needs a bounded operator decision/backup.
- [PublicAchievementResponse](../../apps/api/src/main/java/me/nghlong3004/olympic/recognition/response/PublicAchievementResponse.java) excludes evidence metadata/URLs, submitter/reviewer IDs/notes/times and version. Account DTOs are separate. Evidence is always private, active owner/admin-authorized original bytes with `no-store`/`nosniff`; public achievement/profile visibility confers no evidence access.
- Owners manage their submissions/visibility; admin reviews PENDING, requires reasons for rejection/revocation and uses `expectedVersion`. Stale decisions conflict rather than overwrite; evidence replacement increments version even with unchanged metadata. Album-photo changes likewise version the album. Student/admin multipart metadata+evidence submission is separate from album editing; resubmit replaces evidence.
- PostgreSQL's active-claim uniqueness covers user, case-insensitive title, category and achieved date for PENDING/APPROVED, including concurrent requests. Rejected/revoked history stays stored; resubmission cannot collide with another active claim. No score cap/highest-award-only rule is inferred.

## Storage and recovery

V14 introduced albums/photos/achievements/evidence/preferences; API migration precedes matching web use. Keep applied migrations. Private evidence/photo bytes stay in PostgreSQL behind authorized endpoints, not invented public Cloudinary URLs. Actual validation lives in [RecognitionUploadPolicy](../../apps/api/src/main/java/me/nghlong3004/olympic/recognition/service/RecognitionUploadPolicy.java) and [web validation](../../apps/web/src/features/recognition/validation.ts): evidence1–3 files,5MiB each/15MiB total; album max10 JPEG/PNG/WebP photos,5MiB each/15MiB batch. Ensure request/ingress limits accommodate metadata. Max50 pending achievements/student; log IDs/status/counts, never private bytes or Hibernate JDBC bind values.

[HonorEditor](../../apps/web/src/features/recognition/honor-editor.tsx) saves DRAFT before new-photo upload and publishes only after successful upload. Failure can leave a saved draft; retained id/version/files enable retry while open, closing loses unsent File objects. On409, compare/refetch rather than overwrite. Album save/upload/publish is not one atomic operation. The [controlled evidence picker](../ui/owners/identity-and-recognition.md#selecting-and-submitting-recognition-evidence) never simulates persistence; [private viewer](../ui/owners/dialogs-and-media.md#recognition-depthcarousel-and-evidence-capability) has no Recognition PDF first-page contract and retains original download.

## Focused verification

[RecognitionPointsPolicyTest](../../apps/api/src/test/java/me/nghlong3004/olympic/recognition/RecognitionPointsPolicyTest.java), [RecognitionIntegrationTest](../../apps/api/src/test/java/me/nghlong3004/olympic/recognition/RecognitionIntegrationTest.java) and controller tests cover scoring/privacy/version/concurrency. Docker-skipped/unit-only proof does not establish DB behavior. [Profile/upload journey](../../apps/web/tests/individual-recognition-browser-check.mjs), [media](../../apps/web/tests/recognition-media-browser-check.mjs) and presentation/return tests cover bounded UI states; fixtures do not prove live authorization/providers/physical devices. [Current status](../reviews/ux-flow-audit.md) owns accepted validation limits.
