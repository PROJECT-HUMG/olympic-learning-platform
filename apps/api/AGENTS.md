# API working guide

## Current state

- Spring Boot 4.0.7, Java 25, and Maven. REST endpoints live under `/api/v1`; springdoc provides OpenAPI UI, and Actuator exposes health and Prometheus endpoints.
- Source is organized by business module in `src/main/java/me/nghlong3004/olympic`. A typical module contains `controller`, `request`/`response`, `service` and `service/impl`, `repository`, `entity`, `mapper`, and domain exceptions. Shared configuration lives under `common`.
- PostgreSQL and JPA persist data. Flyway migrations live in `src/main/resources/db/migration`; JPA uses `ddl-auto: validate`. Redis supports background flows. Assessment import uses PDFBox and an AI parser; the current storage implementation uses Cloudinary.
- Configuration is split across `application.yaml`, `application-dev.yaml`, and `application-prod.yaml`. Integration tests may require Docker/Testcontainers.
- `question` owns manual `schemaVersion` 1 drafts: `single_choice`, `multiple_choice`, `written`, and `written_multipart`. Scientific content stores text, math source, and figure references, not HTML or remote image URLs. Private figures are PostgreSQL `bytea` on an owned draft: JPEG, PNG, or WebP, at most 5 MiB, 20 figures, an 8,000 px edge, and 24 million pixels. Staff figure reads use `Cache-Control: no-store`. Lecturers see published questions plus their own rows; only drafts can be edited, by their owner or an admin, and a manual update requires `expectedVersion`. Do not store new figures through Cloudinary or `/api/v1/storage/upload`. The assessment importer is a separate path and does not prove that stored JSON passed manual validation.
- `exam` keeps the staff draft editable and publishes the next frozen paper. `V16` rejects updates to paper, item, and figure rows. Publish copies the selected published questions and their private figure bytes. `GET /api/v1/exams/papers` and `/api/v1/exams/papers/{paperId}` are the scheduled list and read routes; draft ids are UUIDs so `/papers` stays literal. A student receives a paper only when `releaseAt` is at or before the application `Clock` (UTC in production). Student JSON has no answer or explanation, and solution-only figure bytes are not found. There is no attempt or grading flow.

## Working practices

1. **Before creating or changing any Java file**, read the repository's `.agents/skills/backend/SKILL.md`; it is the required backend style reference. Inspect a nearby module and `docs/architecture/backend-conventions.md` when relevant.
2. Validate input at the request/trust boundary, enforce authorization in the appropriate security or service layer, and keep business rules in services. Do not expose JPA entities directly from the API; follow the existing request/response and mapper patterns.
3. Use a new Flyway migration for schema changes. Account for existing data and rollback before changing columns or constraints. Keep `/api/v1` routes and the web contract consistent.
4. For auth, permissions, imports, and uploads, check error cases, access rights, input size and format, and retry or concurrency behavior in the existing flow.
5. Run relevant tests with `./mvnw test` (optionally `-Dtest=...`) and build when the change warrants it. Never put tokens, passwords, or API keys in tests or documentation.

See [README.md](README.md) for setup and configuration.
