# Architecture map

Start with [named features](../README.md#feature-lookup) for a screen or endpoint; that row links source and focused checks directly. Read only the cross-feature contract needed:

| Owner | Why it remains |
| --- | --- |
| [Authentication](authentication.md) | Security/session boundaries, OTP/token recovery, Turnstile and account-mail delivery |
| [Backend](backend-architecture.md) | Import commit/recovery/fencing, upload compensation, frozen-content and rollout constraints |
| [Frontend](frontend-architecture.md) | Query/draft authority and Daily autosync/conflict/private-state recovery |
| [Recognition](recognition.md) | Accepted points/visibility/consent policy, private evidence and irreversible V24 publication/reversal |
| [Study rooms](study-rooms.md) | Membership/accounting/concurrency and shared selection versus local playback lifecycle |
| [HUMG UI rules](web-ui.md) | Shared visual/interaction rules required by web AGENTS; [UI index](../ui/README.md) identifies component owners |

App READMEs/build files own setup/stack/commands; root/app AGENTS and [backend skill](../../.agents/skills/backend/SKILL.md) own working conventions. [Identity guide](../ui/owners/identity-and-recognition.md#avatar-crop-and-storage-contract) owns avatar metadata/storage; OTP/email live with authentication, not separate overlapping files. [Product decisions](../prd.md#open-decisions), [deployment/recovery](../deployment/README.md) and [current status](../reviews/ux-flow-audit.md) retain their own responsibility. No old plan/diagram establishes current capability, test coverage or publication authority.
