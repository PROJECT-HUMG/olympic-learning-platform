# Bounded API/backend audit

Local implementation update: the six findings below are retained as frozen audit evidence. [Remedy acceptance](#local-remedy-disposition--14102026) records the later authorized repairs; no backend publication has occurred.

Frozen checkpoint: `7a70002f71e88c9ae2e1e989fa1b30f609e14f83`. The native audit was read-only and wrote only `/tmp/humg-backend-audit-20261014`; Lead subsequently preserved this accepted report in the documentation tree. No backend source/test/resource change.

## Lead disposition — 14/10/2026

**ACCEPT** the six findings as supported audit results after inspecting the actual report, frozen source hashes and key call paths. This is not acceptance of a backend repair or permission to change policy. API-02 through API-05 share an import-lifecycle boundary and should be resolved together with PostgreSQL/Redis failure/retry proof. API-06 is accepted for current layering/compensation risk, not as proof of a private-evidence leak or authority to restrict every upload folder. Expired direct-link, token-revocation consistency and legacy media policy remain explicitly unresolved. Corrected the native report's PostController slug reference to lines56–60; immutable original evidence is retained in `/tmp`.

Follow-up owner: Lead when backend implementation is authorized; no backend fixes in this scope. The existing [work-status entry](ux-flow-audit.md) remains the task tracker; this file is the audit evidence record. [Project context](../README.md) / [architecture map](../architecture/README.md).

## Actionable findings

### API-01 — P1: Public News slug read bypasses the publication-time gate

Evidence: `apps/api/src/main/java/me/nghlong3004/olympic/post/service/impl/PostServiceImpl.java:151-165,314-327`; `apps/api/src/main/java/me/nghlong3004/olympic/post/repository/PostSpecifications.java:19-32`; `apps/api/src/main/java/me/nghlong3004/olympic/post/controller/PostController.java:56-60`; `apps/api/src/main/java/me/nghlong3004/olympic/common/security/SecurityEndpoints.java:PUBLIC_GET_ENDPOINTS`

Rule: API guide: preserve authorization/data contracts; list and detail must share publication eligibility.

Consequence: A PUBLISHED article scheduled ten days ahead is absent from the list but readable immediately by a known/guessed slug, including its body and thumbnail.

Smallest remedy: Reuse one server-side public visibility predicate for list/detail and injected Clock. Add before/at publication tests. Decide expiry archival detail semantics explicitly rather than assuming list expiry means old direct links must stop.

Verification/limit: Two temporary Mockito observation tests confirm both future-dated and expired PUBLISHED records are returned. Anonymous route eligibility traced in security source; no deployed HTTP request. Confidence: High for future disclosure and list/detail divergence. Expired-read intent remains unknown.

### API-02 — P1: Import event can be consumed and acknowledged before its database row commits

Evidence: `apps/api/src/main/java/me/nghlong3004/olympic/assessment/service/impl/AssessmentImportServiceImpl.java:64-82,180-194`; `apps/api/src/main/java/me/nghlong3004/olympic/assessment/service/impl/RedisAssessmentImportQueue.java:56-59,77-85`; `apps/api/src/main/java/me/nghlong3004/olympic/assessment/service/impl/AssessmentImportProcessorImpl.java:60-65`

Rule: Backend skill sections10/15: service transaction ownership and concurrent-safe flow; import queue declares DB source of truth.

Consequence: Create saves the row then emits Redis inside the still-open transaction. An independent consumer may read the event before row visibility; processor returns for missing row and consumer ACKs. The eventual committed job remains QUEUED, while HTTP retry accepts FAILED only.

Smallest remedy: Publish after commit and provide durable queued-job reconciliation/outbox for the post-commit enqueue failure window. Do not ACK missing/not-yet-visible work as successful. Preserve failure/retry identity semantics.

Verification/limit: Source-traced transaction/consumer schedule only; no Redis/PostgreSQL race executed. Confidence: High structural race; occurrence frequency unknown.

### API-03 — P2: Pending stream messages have no recovery and replay is not safely bounded

Evidence: `apps/api/src/main/java/me/nghlong3004/olympic/assessment/service/impl/RedisAssessmentImportQueue.java:62-89`; `apps/api/src/main/java/me/nghlong3004/olympic/assessment/service/impl/AssessmentImportProcessorImpl.java:60-81`; `apps/api/src/main/java/me/nghlong3004/olympic/assessment/service/impl/AssessmentImportServiceImpl.java:182-194`

Rule: Queue source promises retries/replays; service invariants require safe lifecycle transitions.

Consequence: Consumer reads only lastConsumed/new messages. Worker crash or commit/ACK exception leaves a pending event that this code never reads/claims again. Blindly adding replay would rerun PROCESSING/PUBLISHED/FAILED jobs: processor excludes only REVIEW_REQUIRED and has no atomic job claim.

Smallest remedy: Add bounded pending/lease recovery with explicit eligible-state/idempotent claim before processing; preserve PUBLISHED as terminal. Reconcile durable QUEUED work. Coordinate with API-02 and API-04 rather than simply replaying every pending entry.

Verification/limit: Searched complete assessment package: no pending/claim/reconciliation caller; findFirstByStatus repository method exists but has no caller. No worker crash simulation. Confidence: High source evidence; no production queue inspection.

### API-04 — P2: Retrying a partially failed import collides with persisted page/draft identities

Evidence: `apps/api/src/main/java/me/nghlong3004/olympic/assessment/service/impl/AssessmentImportProcessorImpl.java:67-75,95-135`; `apps/api/src/main/java/me/nghlong3004/olympic/assessment/service/impl/AssessmentImportServiceImpl.java:182-194`; `apps/api/src/main/resources/db/migration/V7__create_assessment_imports.sql:25-58`

Rule: API guide failure/concurrency/data integrity; queue retry must preserve meaningful progress and recover rather than duplicate child records.

Consequence: A provider exception after page one is caught inside process and can commit prior pages/drafts with FAILED. Retry resets status only; processing restarts page1 and ordinal1 without cleanup/resume, conflicting with UNIQUE(import_id,page_number) and UNIQUE(import_id,ordinal). A successful retry is then not generally possible; generated Cloudinary assets may also be orphaned.

Smallest remedy: Choose atomic attempt replacement/cleanup or an explicit resumable attempt model in the import owner; ensure old children cannot collide and clean external assets through an owned failure path. Add mid-document provider-failure then successful retry integration coverage.

Verification/limit: Processor/retry/repository/migration source trace; no live provider or DB retry reproduction. Confidence: High for ordinary caught external failure; exact rollback outcome for persistence exceptions differs and is not conflated.

### API-05 — P2: Import progress writes remain invisible for the entire provider-processing transaction

Evidence: `apps/api/src/main/java/me/nghlong3004/olympic/assessment/service/impl/AssessmentImportProcessorImpl.java:60-135`; `apps/api/src/main/java/me/nghlong3004/olympic/assessment/service/impl/AssessmentImportServiceImpl.java:85-88`

Rule: Service transaction ownership; truthful loading/progress lifecycle and bounded resource use.

Consequence: All PROCESSING/phase/page progress saves run in one transaction across download, PDF rendering, vision calls and uploads. Polling separate transactions sees old QUEUED/previous state until final commit, and a connection/transaction remains occupied across slow providers. save() or flush() alone does not fix visibility.

Smallest remedy: Use short explicit claim/progress/finalization transactions around provider work outside a long DB transaction, coordinated with idempotency and partial-failure handling above. Do not split transactions without preserving ownership/atomic publication.

Verification/limit: Spring proxy transaction boundary and absence of independent progress transaction traced; actual timing/isolation behavior not measured against DB. Confidence: High transaction semantics; production resource impact unmeasured.

### API-06 — P2: Generic storage HTTP endpoint owns persistence orchestration and has no compensation boundary

Evidence: `apps/api/src/main/java/me/nghlong3004/olympic/storage/controller/StorageController.java:34-60`; `apps/api/src/main/java/me/nghlong3004/olympic/storage/service/impl/CloudinaryStorageService.java:39-81`; `apps/api/src/main/java/me/nghlong3004/olympic/storage/entity/File.java:24-55`

Rule: apps/api/AGENTS: thin controllers and transactions/business rules in services. Backend skill sections10/12: service owns business operation, controller delegates.

Consequence: Controller calls provider, repository and URL builder itself; if metadata save fails the successful external upload has no persisted identity or cleanup. File-purpose policy is spread: only DOCUMENT has a special role gate, all other enum folders are accepted. File metadata has no uploader ownership, so future binding authorization cannot be inferred from UUID presence.

Smallest remedy: Move the existing upload operation into one responsible application service with request/response record, existing provider abstraction, explicit supported-folder policy and compensation after metadata failure. Do not add speculative per-provider interfaces or silently invent a new product upload policy.

Verification/limit: Direct source trace; no upload/database failure injection or provider access. This is a concrete layering/recovery finding, not a claim that private Recognition/Daily bytes use this path. Confidence: High ownership deviation/orphan risk. Intended general-folder policy requires product/source-owner confirmation before expanding restrictions.

## Already-correct patterns

- Package-by-feature and constructor-injected service/repository/mapper boundaries are the dominant implemented pattern; there is no evidence-driven need for a new interface on each concrete exam policy collaborator.
- ExamAccess reloads active actor, enforces staff and owner/admin, locks mutable drafts and checks expectedVersion. Publication locks question IDs in stable order and snapshots item/figure bytes. Student reads enforce release time and exclude answer/solution-only figure projections.
- Recognition public profile projection excludes account/security/reviewer/evidence fields; active nondeleted identity eligibility is server-owned. Evidence is owner/admin checked with no-store/nosniff bytes. Ranking SQL keeps opt-in, active student, APPROVED and tied rank semantics; private approved totals are intentionally included per frozen policy.
- V24 is additive and changes old false visibility plus new default only; approval/points/evidence/ranking enrollment are not auto-mutated. Owner future opt-out remains supported.
- Daily owner/save/submit gates reload active actors, serialize plan edits and check versions; group sharing is opt-in and current memberships are rechecked for evidence. Evidence bytes stay DB-owned and attachment delivery is no-store.
- Refresh tokens are hashed and row-locked; replay family revocation uses a separate REQUIRES_NEW owner so outer exception does not undo it. Turnstile success/hostname/action failures close before login issuance.
- Shared exception owner returns ProblemDetail; no JPA entity was found exposed by the sampled HTTP contracts. General style issues (wildcard imports, duplicate imports, missing annotations/headers in some infrastructure) are lower priority than concrete behavior and do not justify broad refactor.

## Residual risks and policy limits

- JWT status/role/permissions are snapshots; Question/Assessment staff guards trust claims while Recognition/Exam/Daily/Room reload live actors. DOCUMENT_UPLOAD revocation is not immediate for an existing access token. Short-lived-token bounded staleness may be intentional; no new revocation policy is mandated by this audit. Explicitly decide consistency before changing auth semantics.
- Document and Post public read counters use unlocked read-modify-write without @Version; concurrent requests can lose increments. DocumentRepository already has atomic increment owners. Count accuracy/concurrency not runtime-tested; no authorization impact inferred.
- Avatar replacement performs Cloudinary deletion before database commit, so rollback after metadata persistence failure cannot restore old bytes. No provider failure injection; follow up alongside storage compensation only if repair scope is authorized.
- Legacy imported page/question assets use unsigned Cloudinary delivery after staff API checks; those URLs are bearer-readable once learned and not expired by application logout. Manual-question figures, Recognition and Daily evidence use separate protected DB byte owners. No claim is made about current provider ACLs or live URL accessibility.

## Documentation contradictions

- Frozen docs/architecture/README.md calls Spring Modulith implemented and says documentation prevails over code; current POM lacks Modulith and current protocol/AGENTS state source is implementation authority. Treat stale draft prose as documentation cleanup, not proof backend violates an adopted Modulith contract.
- Draft architecture-contract-v1.0 claims Java26,80% coverage/cursor paging while current authoritative app guide/skill/POM specify Java25 and no numeric coverage gate. No finding demands Java26 migration, a coverage threshold or universal cursor paging.

## Coverage

- **security_auth**: Read chains, endpoint allowlists, bearer principal conversion, authorities/current-user provider; traced password login/refresh rotation/replay compromise and Turnstile checks. AuthController and ancillary OTP/rate-limit implementations only map-level/limited reading; no full crypto or abuse audit.
- **recognition_profile**: Read service, repository ranking SQL, profile/public identity mapper/contracts, evidence controller/byte headers, V24. Approval/public visibility/active-user/ranking-consent separation traced. Upload-policy internals and all concurrency integration tests not re-executed.
- **documents_posts_storage**: Read controllers/services/mappers/repositories/entities and Cloudinary implementation. Public/list/detail and ownership/method permissions traced. No CDN/media/provider calls or exhaustive content sanitization review.
- **assessment_import**: Deep source trace create/status/review/retry/publication/worker/Redis consumer, entities/repository and V7 constraints. Parser/provider implementation and real PDF resource exhaustion not exhaustively audited.
- **questions_exams**: Read key staff/ownership/draft/version/private-figure paths, exam access/publication/paper read/figure paths; inspected validation/policy owner structure. No exhaustive scientific block parser or frozen-paper DB concurrency rerun.
- **daily_groups**: Read plan/save/submit/week actors/locking/version checks, evidence list/byte/mutation ownership and sharing/current-member gates, group HTTP sharing/leave/invite and foundation boundaries. No full feedback/summary algorithm audit or fresh PostgreSQL tests.
- **rooms**: Traced active-user/user-lock then room-lock ordering, transfer stable user order, membership lease and playback/rhythm expected versions. Rules unit tests run. No concurrent multi-client playback/runtime proof.
- **structural_inventory**: 23 controller classes mapped;449 production Java files compiled in /tmp. Compilation is not semantic audit coverage of every class. Package-by-feature/service interfaces/MapStruct DTO pattern sampled across all main families.

## Verification

- `env JAVA_HOME=/home/nghlong3004/.jdks/openjdk-26.0.1 ./mvnw -o -Dtest=PostServiceImplTest,DocumentServiceImplTest,RecognitionPointsPolicyTest,ExamPlacementPolicyTest,StudyRoomRulesTest,GroupDailyAccessTest test` in `/tmp/humg-backend-audit-20261014/snapshot/apps/api` — PASS46 tests;0 failures/errors/skips; all449 production Java files compiled with release25,56 test source files. JDK26 available; no Java25 executable in current PATH. Not exact JDK25 runtime proof. No runtime resources/config copied.
- `env JAVA_HOME=/home/nghlong3004/.jdks/openjdk-26.0.1 ./mvnw -o '-Dtest=PostServiceImplTest#audit_observation_*' test` in `/tmp/humg-backend-audit-20261014/snapshot/apps/api` — PASS2 temporary observation tests confirming future and expired public-slug acceptance; not desired-behavior regression passes. Mockito/service fixture, no HTTP/database/provider.

Maven/Mockito/Lombok inherited deprecation/dynamic-agent/unchecked warnings remain. Cached offline dependencies only; no system/provider configuration changed. The second two-test run replaces the Post surefire report; first-run46 summary was captured by tool completion. Other five suite XMLs remain alongside the final two observation-test XML.

## Limits

- No services/containers/live data/provider calls; no env/credentials/operator sessions read.
- No fresh PostgreSQL/Flyway/Redis/Testcontainers/auth HTTP integration proof; queue/concurrency/DB cases remain source-based unless labelled temporary observation test.
- Offline tests used cached dependencies and a frozen-source /tmp copy without resources; runtime configuration validation/production startup is not claimed.
- Audit is proportionate across domain boundaries, not an all449-file security review.

Exact frozen source hashes and evidence paths: `/tmp/humg-backend-audit-20261014/report.json` (SHA256 `efc949fe3e80ec7b61749089fdefa8527da166b95f25714f2a2f1618d80c36e3`). Temporary observation-test source: `/tmp/humg-backend-audit-20261014/post-observation-tests.java.txt`. These local artifacts may expire; the findings, source references and limits remain in this record.


## Local remedy disposition — 14/10/2026

Lead ACCEPTS the14-Java-path repair candidate `8cefe9e626251e19ebe59d1e4235aeca5d9d9f1ff0ccc197716165d3db3251bb` on7a70002 after inspecting the sole native writer's actual source/snapshot/handoff. API-01 through API-06 are implemented locally: Clock release guard; commit-aware Redis plus durable DB recovery; locked attempt/lease fencing; unpublished retry child replacement; short progress/page transactions outside provider work; thin upload service with known-outcome compensation. No additive migration was necessary: existing lease/attempt columns provide the fence. Broader expiry/media/access policies are unchanged.

[Existing status](ux-flow-audit.md#backend-audit-remedies--accepted-local-14102026) records exact behavior, tests, formatting, preservation and limits.38 combined tests passed including10 real isolated PostgreSQL/Redis tests; the later2-case stale-worker success/failure test extends one overlapping case. Final compile and Google Java Format1.37.0 check passed on14 changed Java files; no project formatter was configured or added. Proof is in `/tmp/humg-backend-fixes-20261014/`, with final exact paths/hashes in final-manifest.json. No staging/commit/push/deploy.

Do not reinterpret these tests as live/provider/JDK25-runtime or all-backend proof. Provider crash/delete failure and unknown-commit orphan limits remain; unknown commits retain bytes.30-minute step leases require explicit retry after failure. Future rollout must drain old unfenced workers. Unresolved expired direct-link archival, broader folder/media and revocation-policy questions remain separate from the repairs.
