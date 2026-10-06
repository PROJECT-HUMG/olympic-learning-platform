# Repository Guidelines

## Project Structure & Module Organization

This API uses Spring Boot 4.0.7, Java 25, Maven, PostgreSQL/JPA, and Redis.

- `src/main/java/me/nghlong3004/olympic`: business modules with `controller`, `request`, `response`, `service/impl`, `repository`, `entity`, and `mapper`; shared infrastructure belongs in `common`.
- `src/test/java`: tests mirroring source packages.
- `src/main/resources`: `application*.yaml` profiles, mail assets, and `db/migration` Flyway scripts.

## Build, Test, and Development Commands

Use `rtk`; run Maven commands from `apps/api` with Java 25.

- From repository root: `rtk proxy docker compose -f compose.dev.yml up -d` starts PostgreSQL, Redis, and Mailpit.
- `rtk proxy ./mvnw spring-boot:run`: starts the API on port 8080.
- `rtk proxy ./mvnw test`: runs tests.
- `rtk proxy ./mvnw package`: tests and builds the executable JAR.

See [README.md](README.md) for environment setup.

## Coding Style & Naming Conventions

Before any Java edit, read [the backend style guide](../../.agents/skills/backend/SKILL.md). Match existing two-space Java indentation. Use PascalCase types, camelCase members, and role suffixes such as `QuestionServiceImpl`, `QuestionRepository`, and `CreateQuestionRequest`.

Keep controllers thin; place business rules/transactions in services. Use constructor injection, record payloads, MapStruct, and shared `ErrorCode` handling; never expose JPA entities. Include required author/date headers and OpenAPI annotations. No formatter/linter plugin is configured in Maven.

## Testing Guidelines

Use JUnit Jupiter, Spring testing, and AssertJ. Name classes `*Test.java` and methods after behavior. Run focused tests with `rtk proxy ./mvnw -Dtest=StudyRoomRulesTest test`. PostgreSQL Testcontainers tests require Docker; skipped tests do not prove persistence. No numeric coverage gate is configured. Cover authorization, validation, concurrency, and failure cases; report skipped checks.

## Commit & Pull Request Guidelines

Follow Conventional Commits, e.g. `feat(auth): protect forms with Turnstile`. Keep commits focused. PRs should describe behavior, link relevant issues, and list verification, contract changes, and migration/rollback implications.

## Security & Data Invariants

Trace request/authorization/data flow; preserve unrelated work and `/api/v1` contracts. Validate boundary inputs and enforce ownership. Never commit/log secrets. Add migrations; never rewrite applied ones. Keep JPA schema validation and web types/services/documentation synchronized.

Manual questions retain `schemaVersion` 1 scientific blocks, never HTML/remote images. Only owners/admins edit drafts, with `expectedVersion`. Store private JPEG/PNG/WebP figures in PostgreSQL, never Cloudinary: 5 MiB/file, 20 figures, 8,000 px edge, 24 million pixels; serve staff reads with `no-store`. Import validation is separate.

Published exam papers/items/figures remain immutable. Student access requires `releaseAt <= Clock`; exclude answers, explanations, and solution-only figures. No attempt/grading flow exists.
