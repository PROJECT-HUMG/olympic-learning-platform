# API working guide

## Current state

- Spring Boot 4.0.7, Java 25, and Maven. REST endpoints live under `/api/v1`; springdoc provides OpenAPI UI, and Actuator exposes health and Prometheus endpoints.
- Source is organized by business module in `src/main/java/me/nghlong3004/olympic`. A typical module contains `controller`, `request`/`response`, `service` and `service/impl`, `repository`, `entity`, `mapper`, and domain exceptions. Shared configuration lives under `common`.
- PostgreSQL and JPA persist data. Flyway migrations live in `src/main/resources/db/migration`; JPA uses `ddl-auto: validate`. Redis supports background flows. Assessment import uses PDFBox and an AI parser; the current storage implementation uses Cloudinary.
- Configuration is split across `application.yaml`, `application-dev.yaml`, and `application-prod.yaml`. Integration tests may require Docker/Testcontainers.

## Working practices

1. **Before creating or changing any Java file**, read the repository's `.agents/skills/backend/SKILL.md`; it is the required backend style reference. Inspect a nearby module and `docs/architecture/backend-conventions.md` when relevant.
2. Validate input at the request/trust boundary, enforce authorization in the appropriate security or service layer, and keep business rules in services. Do not expose JPA entities directly from the API; follow the existing request/response and mapper patterns.
3. Use a new Flyway migration for schema changes. Account for existing data and rollback before changing columns or constraints. Keep `/api/v1` routes and the web contract consistent.
4. For auth, permissions, imports, and uploads, check error cases, access rights, input size and format, and retry or concurrency behavior in the existing flow.
5. Run relevant tests with `./mvnw test` (optionally `-Dtest=...`) and build when the change warrants it. Never put tokens, passwords, or API keys in tests or documentation.

See [README.md](README.md) for setup and configuration.
