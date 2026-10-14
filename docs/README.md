# Project documentation

Choose the task first; follow its source owner rather than reading every document.
[Repository setup](../README.md) and [working rules](../AGENTS.md) remain entry points.

| Task | Start here | Then verify |
| --- | --- | --- |
| Find a screen, component, modal or visual rule | [UI and interaction guide](ui/README.md) | Named source owner and route branch |
| API behavior, module ownership or architecture | [Architecture map](architecture/README.md) | Controller → service → repository/mapper and tests |
| Authentication, public identity or permission/privacy | [Authentication](architecture/authentication.md), [authorization](architecture/authorization.md), [Recognition policy](architecture/recognition.md) | Dedicated public projections, eligibility and evidence-delivery gates |
| Account email / registration OTP | [Account email](architecture/account-email.md), [OTP](architecture/registration-otp.md) | Auth/user services and current requests |
| Daily or room continuity | [State ownership](architecture/state-management.md), [room contract](architecture/study-rooms.md), [Daily source](../apps/web/src/features/daily) | Feature drafts/sync/private gates; do not generalize modal lifecycle |
| Run/check an app | [Web README](../apps/web/README.md), [API README](../apps/api/README.md) | App AGENTS and package/build configuration |
| Release, migration or host operations | [Deployment runbook](deployment/README.md) | Granted authority and current operator-owned environment; never infer permission from prose |
| Current local work / historical audit evidence | [Existing work-status entry](reviews/ux-flow-audit.md) | Exact checkpoint, candidate and recorded evidence limits |
| Product background | [PRD](prd.md), [functional requirements](functional_requirement.md) | Current accepted product decisions and implementation |

## How this tree is maintained

- `architecture/`: domain contracts and engineering references, with app instructions/code/tests resolving implementation details. Older draft contracts are labelled; they do not override current instructions.
- `ui/`: current task/owner routing, linked source, design decisions and preserved topic records. [UI guide](ui/README.md) distinguishes maintained rules from dated adoption counts.
- `reviews/`: one work-status entry plus bounded historical records. Historical pending/release labels describe their own checkpoints.
- `deployment/` and `design/`: operational runbook and specialized design references.

Code, types, executable checks and runtime evidence establish implementation. Accepted product policy remains authoritative; stale examples do not authorize policy changes. A source inventory or synthetic browser capture is not all-screen/live/physical-device proof. `/tmp` artifacts are provenance clues, not durable prerequisites. Do not place secrets, private operator/session records or real personal media in documentation.

[Workspace protocol](WORKSPACE_PROTOCOL.md) defines scope, ownership and evidence boundaries. Follow root/app AGENTS before changing code; the documentation tree does not replace those rules.
