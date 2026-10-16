# Product direction and boundaries

Olympic HUMG supports university Olympic learning and community activity: discover reliable academic resources and announcements, prepare questions/papers, recognize real achievements and support study habits. Students, lecturers and administrators have different tasks and permissions. [Named features](README.md#feature-lookup) are the implementation inventory; aspirations below are not shipped behavior.

## Current product constraints

- Show real source-backed data. Do not fabricate activity, awards, scores, analytics, deadlines or successful uploads. Documents need no mandatory per-user reading-completion tracking.
- Keep university identity, natural Vietnamese, readable compact task layouts, mobile/dark-mode support, keyboard focus and static reduced-motion fallbacks. Different readers, auth, Daily and persistent rooms retain appropriate compositions.
- Roles and permissions are enforced by the API, with ownership/active-account/version checks where required. Navigation visibility alone grants no access. Protect credentials, private evidence and account details from public DTOs, logs and shared caches.
- Honors albums are editorial recognition, independent of approved academic achievements. Points, ranking consent, public visibility and international/nonacademic exclusions follow [Recognition policy](architecture/recognition.md); UI changes cannot redefine them.
- Daily sharing is explicit per dated entry with chosen current group members. Saving and first submission do not share it; other dates and personal weekly reflections remain private. Later joiners receive no automatic access.
- Daily drafts/unknown save outcomes/conflicts must not be silently discarded; Submit and sharing/feedback publication remain deliberate. Frozen exam papers and student release/solution restrictions remain intact. [State/lifecycle rules](architecture/frontend-architecture.md) identify responsible owners.
- Validate uploads and boundary inputs; preserve data identity, versioning and concurrency. Back up persistent data, never rewrite applied migrations, and retain recoverable failure states. [Backend rules](architecture/backend-architecture.md) and the [operator runbook](deployment/README.md) own details.
- Focused tests, meaningful failure-path checks and observed responsive behavior support acceptance. Source inventory, mocked APIs, configuration or passing unit tests alone do not prove live permissions, providers, physical-device usability or production capacity. No established numeric coverage/performance gate should be invented from old proposals.

## Future direction, not current capability

Practice attempts, submissions/grading, mock-exam participation/results, talent/progress analytics, subject learning paths and RAG/chatbot support remain possible later work requiring product/security/data contracts. Future assessment must preserve paper identity, first-submission/finality rules and traceable grading changes; current reader routes do not imply those workflows exist. Formal learning paths should remain guidance rather than depend on tracking every document read.

GPA is now a local calculation/planning utility, not an academic record or institutional grading decision. Current rankings use approved Recognition records, not unimplemented practice results. `/competitions`, `/practice` and `/history` offer honest guidance to available features. Lecturer/admin dashboards expose actual destinations, not invented result metrics.

## Open decisions

- Expired News direct-link archival: future-dated posts are denied, but whether expired articles should remain directly readable is not settled.
- Broader media/folder access and access-token revocation consistency require explicit policy; do not infer new access from UI reuse or existing delivery URLs.
- Reset links may represent password recovery or an admin invitation. The UI receives an opaque token and must not invent invitation-specific recovery/resend.
- Daily reflection has no accepted deadline/countdown target; the 07:30 first-submission rule is not a reflection deadline.
- Document-card composition remains open. “Chưa có ảnh” is acceptable; the concern is oversized/isolated missing-preview space, not wording removal.

[Current checkpoint and verification limits](reviews/ux-flow-audit.md) records current local work. Documentation grants no commit, publication, provider-spend or deployment authority.
