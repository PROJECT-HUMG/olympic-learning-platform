# Phase 3 — Architecture Design

Mục tiêu: trả lời câu hỏi “Hệ thống sẽ được tổ chức như thế nào?”

## Artifact

```text
3.1 Architecture Drivers
3.2 C4 Context Diagram
3.3 C4 Container Diagram
3.4 Technology Decisions
3.5 Architecture Decision Records
3.6 Security Architecture
3.7 Deployment View
```

### Example

Architecture drivers (động lực kiến trúc) có thể là:

```text

- Dễ maintain cho Spring Boot project.
- Dễ mở rộng thêm môn/chuyên đề/câu hỏi.
- Dễ thêm OAuth2/JWT.
- Dễ thêm import Excel sau này.
- Dễ expose API cho frontend.

```

Ở phase này mới chốt:

```text
Backend: Spring Boot
Database: PostgreSQL
Migration: Flyway
Auth: JWT + OAuth2
API docs: OpenAPI/Swagger
Architecture style: Modular Layered Monolith
```

## Exit criteria

```text
- Chọn được architecture style.
- Có diagram mức Context/Container.
- Có lý do chọn công nghệ.
- Có các quyết định quan trọng được ghi lại bằng ADR.
```


