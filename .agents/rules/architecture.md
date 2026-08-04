# Architecture Rules

Flow

Controller
↓
Service
↓
Repository
↓
Database

Rules

- Package-by-feature.
- Controllers contain no business logic.
- Services contain business logic.
- Repositories only access persistence.
- Never expose JPA entities through API.
- Requests and Responses are Java records.
- Use MapStruct for mapping.
- Use constructor injection only.
