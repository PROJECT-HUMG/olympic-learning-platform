---
name: olympic-context
description: Find the responsible code, current contract and focused verification for a named feature or unfamiliar task in the Olympic Learning Platform repository. Use only in this repository.
---

# Olympic project context

The useful result is a short path to the actual owner, binding invariants and
relevant check, not a new context summary. Root/app `AGENTS.md` hold working rules;
READMEs hold setup. Use [the feature lookup](../../../docs/README.md#feature-lookup)
for Vietnamese UI names and code aliases, then read only that row's source,
contract and check. Trace the caller/route and real data before deciding to edit.

[Current work](../../../docs/reviews/ux-flow-audit.md) records accepted limits and
pending scope; inspect actual Git status/history on resumption. A status paragraph
can lag the checkout. Remote/deployed state needs its own evidence and authority;
a local candidate, commit or passing fixture does not establish publication.

## Owner lookup

| Task | First source |
| --- | --- |
| API endpoint/rule | `apps/api/src/main/java/me/nghlong3004/olympic/<module>`: controller → existing service/policy → repository/mapper/entity |
| Schema/config | `apps/api/src/main/resources/db/migration`, `application*.yaml`; [API baseline/setup](../../../apps/api/README.md#flyway-baseline) |
| Auth/access | API `auth`, `user`, `admin`, `common/security`; web `src/router/guards`, `src/stores/use-auth-store.ts`, `src/lib/axios.ts` |
| Web route | `apps/web/src/router/routes.tsx` and `route-constants.ts` → mounted page/layout/feature |
| Data/cache/drafts | Owning feature hook/service/types; `src/lib/query-client.ts`, `src/lib/axios.ts`; [frontend contracts](../../../docs/architecture/frontend-architecture.md) |
| Shared UI/motion | [UI owner index](../../../docs/ui/README.md) → actual shared/feature owner; `apps/web/src/index.css` tokens |
| Delivery/recovery | [Operator runbook](../../../docs/deployment/README.md) → `.github/workflows/delivery.yml`, `deploy/ssh-deploy.sh`, `deploy/deploy.py` |

## Gotchas

- Feature lookup marks guidance-only practice/history/competition pages; route
  constants and old plans alone do not prove a mounted or implemented capability.
- Home mounts `pages/home-page.tsx` → HomeStudyNotebook/useHomeNews with real queries;
  `home-mock-data.ts` is legacy widget data, not its current content source.
- OTP is a registration state inside the shared auth shell; isolated CodeSlots
  fixtures do not establish the routed screen's layout or auth behavior.
- V1 is the fresh-install Flyway baseline. Old copied SQL in `target/classes` needs
  a clean local build, not a database reset. Subsequent applied history stays protected.
- For Java edits, read [the backend skill](../backend/SKILL.md); for UI edits, use
  [web instructions](../../../apps/web/AGENTS.md). Neither discovery nor an earlier
  task's native-subagent exception expands current write/delegation authority.

[Architecture](../../../docs/architecture/README.md) retains cross-feature contracts;
[open decisions](../../../docs/prd.md#open-decisions) remain unresolved until their
owner decides. Keep source ownership/decisions in their existing guide or status
source and execution history in Git, rather than accumulating parallel trackers.
