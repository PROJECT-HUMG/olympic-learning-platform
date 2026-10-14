# Architecture map

Start with [documentation tasks](../README.md). These references describe intent and contracts; trace the current source before judging implementation. Root/app AGENTS and accepted product policy outrank stale examples. Current stack and commands live in [API](../../apps/api/README.md) and [web](../../apps/web/README.md) guides.

| Question | Reference |
| --- | --- |
| System boundaries / technology rationale | [Overview](system-overview.md), [technology decisions](technology-decisions.md), [module boundaries](module-boundaries.md) |
| API ownership and conventions | [Backend architecture](backend-architecture.md), [backend conventions](backend-conventions.md), [authoritative Java skill](../../.agents/skills/backend/SKILL.md) |
| Web route/state/request ownership | [Frontend architecture](frontend-architecture.md), [conventions](frontend-conventions.md), [routing](routing.md), [state](state-management.md), [API communication](api-communication.md), [request lifecycle](request-lifecycle.md) |
| Auth, OTP and account changes | [Authentication](authentication.md), [authorization](authorization.md), [registration OTP](registration-otp.md), [account email](account-email.md) |
| Public profiles, achievements, Honors / ranking consent | [Recognition](recognition.md), [public identity owners](../ui/owners/identity-and-recognition.md), [avatar framing](avatar-framing.md) |
| Page composition, controls, dialogs and feedback | [Current UI guide](../ui/README.md), [design tokens/rationale](design-system.md), [surface conventions](ui-surfaces.md) |
| Rooms and continuity | [Study-room contract](study-rooms.md) |
| Historical UI adoption/audits | [Work status and evidence](../reviews/ux-flow-audit.md), [reuse inventory](web-ui-reuse-audit.md) |

## Draft contracts and historical evidence

[English architecture draft](architecture-contract-v1.0.md) and [Vietnamese draft](architecture-contract-v1.0-vi.md) preserve earlier proposals. Version/runtime, coverage and pagination examples there are not evidence that current code implements them. In particular, follow current app setup for Java/tooling and the configured test commands; do not impose a numeric coverage gate or cursor API from a draft.

The former long architecture introduction repeated repository purpose/workflow and advertised absent documentation directories. This map consolidates that routing into the actual tree. It does not change code, approved product constraints, module boundaries or migration policy.
