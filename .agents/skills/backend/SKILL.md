---
name: backend-java-style
description: Project Java conventions for Olympic Learning Platform API edits and reviews. Read before creating or changing Java in apps/api; covers Google formatting, ownership, DTOs, persistence and security patterns.
---

# Backend Java conventions

Keep the change at its existing responsible owner. Read
[API instructions](../../../apps/api/AGENTS.md) and the matching row in
[the feature lookup](../../../docs/README.md#feature-lookup); follow its live
source/contract/test. [pom.xml](../../../apps/api/pom.xml) owns dependency versions
and Java target; [API setup](../../../apps/api/README.md) owns commands/configuration.
This skill supplies project conventions, not a module generator or approval flow.

## Formatting and naming

Use [Google Java Style](https://google.github.io/styleguide/javaguide.html) and
[Google Java Format](https://github.com/google/google-java-format/blob/d34669338e718f197048a54e2cff152b919de40c/README.md#using-the-formatter), default Google mode (not AOSP).
This takes precedence over inconsistent legacy whitespace. Format owned changes;
do not reformat unrelated classes just to standardize the repository. The verified
formatter reference is **1.37.0**; Maven currently has no formatter/checkstyle plugin,
so a successful Maven build does not establish formatting compliance.

With JDK25 available and `GOOGLE_JAVA_FORMAT_JAR` pointing to a trusted local
`google-java-format-1.37.0-all-deps.jar`, from the repository root:

```bash
rtk proxy java -jar "$GOOGLE_JAVA_FORMAT_JAR" --replace path/to/Changed.java
rtk proxy java -jar "$GOOGLE_JAVA_FORMAT_JAR" --dry-run --set-exit-if-changed path/to/Changed.java
```

For a legacy file, inspect the resulting diff and constrain formatting to the
owned region when full-file formatting would create unrelated churn. Line ranges
can still reflow adjacent constructs/imports; inspect the diff. The formatter does
not enforce every style rule. Use explicit imports
(including static imports), braces for control flow, and simple imported type names;
resolve name collisions explicitly. Old wildcard imports in examples are not a new
style requirement. Preserve existing author/date headers; new files follow the
module's attribution and `@since M/dd/yyyy` creation-date convention.

Packages are `me.nghlong3004.olympic.<feature>` with role subpackages. Names follow
nearby contracts: domain nouns for entities (no `Entity` suffix), action-driven
`*Request`/`*Response`, `*Repository`, `*Mapper`, and domain/concept enums. Existing
service interfaces omit an `I` prefix; their implementations use `service/impl`
and `*ServiceImpl`. Keep shared infrastructure in `common` only when actually shared.

## Ownership and contracts

- Controllers bind/validate HTTP input, document changed endpoints with OpenAPI,
  apply the existing security boundary and delegate business work. Do not expose
  JPA entities. Preserve response headers, cookies, status codes and `/api/v1`.
- Services/policies own business decisions and transaction boundaries; repositories
  own persistence/query behavior. Extend existing service interfaces where callers
  use them. Do not create an interface/implementation pair, mapper or extra layer
  just to complete a fixed template or claim SOLID compliance.
- Use constructor injection; production services commonly use
  `@RequiredArgsConstructor`. Existing test injection is not production field-DI guidance.
  Keep small entity guards/policies where the module already places them; do not
  force every guard into another service. Split by responsibility when needed,
  not by an arbitrary class/method line limit.
- Request/response and immutable internal payloads normally use records.
  Jakarta validation belongs on boundary inputs; the backend remains authoritative.
  Internal DTOs are not automatically safe API projections. Document meaningful
  interface behavior/edge cases without duplicating Javadoc on implementations.
- Extend the module's MapStruct pattern (`componentModel = "spring"`, existing
  unmapped-target policy); explicitly control public/private projection fields.
  [AuthMapper](../../../apps/api/src/main/java/me/nghlong3004/olympic/auth/mapper/AuthMapper.java)
  is a mapping example, not a reason to add a mapper for every object.

## Persistence and failure semantics

JPA entities are mutable classes, not records. Preserve explicit table/column
mappings, UUID identity/generation strategy, optimistic versions, indexes, FKs,
checks and native-enum mappings. Use `OffsetDateTime`/`timestamptz` for persisted
instants and `LocalDate`/`date` for date-only contracts; time-based eligibility uses
the existing injected `Clock`. Repository lookups commonly return `Optional`;
nullable DTO/patch fields retain their actual contract rather than a blanket
"never null" rule.

[AuthEmailToken](../../../apps/api/src/main/java/me/nghlong3004/olympic/auth/entity/AuthEmailToken.java)
shows UUID, timestamp and `@Enumerated`/`SqlTypes.NAMED_ENUM` mapping.
[The Flyway baseline](../../../apps/api/README.md#flyway-baseline) explains the
explicitly authorized unapplied-history consolidation. It is not standing permission
to rewrite applied history, run repair/clean or reset an operator database.
Keep Hibernate schema validation and append subsequent applied-schema changes.

Use the shared
[ErrorCode](../../../apps/api/src/main/java/me/nghlong3004/olympic/common/error/ErrorCode.java)
/ `throwIt(...)` / `GlobalExceptionHandler` path for domain failures and preserve
ProblemDetail/error-code contracts. Retain intentionally nullable results and
exception types required by existing adapters/framework APIs. Use `@Slf4j` for
meaningful state transitions/failures, not method-by-method logging. Never log
credentials, tokens, private evidence bytes or Hibernate bind payloads.

## Gotchas

- [SecurityFilterChainsConfig](../../../apps/api/src/main/java/me/nghlong3004/olympic/common/security/SecurityFilterChainsConfig.java)
  owns filter-chain configuration. Follow method security and service-level
  role/ownership checks as well as routes.
- Storage is feature-specific: generic file metadata/Cloudinary does not authorize
  public delivery of Recognition, Daily, group-avatar or question/exam private bytes.
  Follow the feature's contract; do not invent thumbnail/public URLs.
- Import wakeups must follow commit. External provider/PDF/upload work, short DB
  transactions, lease fencing, retry ownership and compensation have distinct
  owners. A rollback or unknown commit must not delete potentially referenced bytes.
- Published exam versions remain frozen; release eligibility and private answer/
  figure filtering are server-authoritative. UI visibility never grants access.

[Backend contracts](../../../docs/architecture/backend-architecture.md) owns these
cross-feature invariants and rollout limits; read its relevant section when affected.
[Feature tests](../../../docs/README.md#feature-lookup) and
[API test guidance](../../../apps/api/AGENTS.md#testing-guidelines) identify focused
proof. Separate structural/unit, real DB/Redis and synthetic/live-provider evidence;
skipped tests are not a pass for the behavior they did not exercise.
