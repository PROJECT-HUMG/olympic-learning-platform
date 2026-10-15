# Shared controls and auth forms

Use [named features](../../README.md#feature-lookup) for screens and [UI rules](../../architecture/web-ui.md) for styling. Shared primitives own presentation/focus, never business access or submit policy.

## Interaction owner lookup

| Interaction | Shared owner | Feature responsibility |
| --- | --- | --- |
| Review/context; destructive/dirty confirmation | [Dialog](../../../apps/web/src/components/ui/dialog.tsx), [AlertDialog](../../../apps/web/src/components/ui/alert-dialog.tsx) | Users/Recognition/Documents own pending dismissal, error/action and exact return focus |
| Long Create/Edit | [CreationDialog](../../../apps/web/src/components/ui/creation-dialog.tsx), [CSS](../../../apps/web/src/components/ui/creation-dialog.css) | Post/Document/Recognition/question/category forms own dirty/busy/save; preserve nested controls and one scrolling body |
| Private preview/zoom/download | [EvidenceGallery](../../../apps/web/src/components/ui/evidence-gallery.tsx) | Daily/Recognition adapters authorize/revalidate bytes, abort/revoke URLs and preserve original download; [media contracts](dialogs-and-media.md) |
| Native group creation / persistent room music | [GroupList](../../../apps/web/src/features/daily/groups/group-controls.tsx), [RoomMusicDialog](../../../apps/web/src/features/study-room/components/room-music-dialog.tsx) | Native modal focus/scroll lifecycle stays local; room player remains mounted across close/reopen |
| Nested editor image/link chooser | [RichTextEditor](../../../apps/web/src/components/ui/rich-text-editor.tsx), [PostForm](../../../apps/web/src/features/post/components/post-form.tsx) | Preserve selection, cancel/opener focus and upload-busy dismissal; image/storage validation remains feature-owned |
| Menu/select/combobox | [DropdownMenu](../../../apps/web/src/components/ui/dropdown-menu.tsx), [Select](../../../apps/web/src/components/ui/select.tsx), [Combobox](../../../apps/web/src/components/ui/combobox.tsx), [floating motion CSS](../../../apps/web/src/components/ui/floating-controls.css) | Radix owns collision/focus/dismissal; preserve native select behavior and avoid competing positioning transforms |

## CodeSlots verification and SwipeToast

[CodeSlots](../../../apps/web/src/components/react-bits/code-slots.tsx) adapts free `CodeSlots-TS-CSS` around one controlled native six-digit input. Preserve real label/value/ref, leading zeros, full-code paste, native editing/arrows/backspace, numeric keyboard and `one-time-code` autocomplete. No auto-submit, code deletion on error or demo-success state. Reduced motion keeps static visible digits.

[SwipeToast](../../../apps/web/src/components/react-bits/swipe-toast.tsx) renders the existing public Sonner store through [Toaster](../../../apps/web/src/components/ui/sonner.tsx); callers still import `toast` from Sonner. Keep one store and one presentation/lifetime owner. Loading/promise/same-ID updates, custom content, actions/callbacks, announcements, timeout/pause, keyboard dismiss/focus and touch swipe retain real semantic behavior. Reduced motion is static without losing lifetime state. Keep44px controls and [short-modal Close clearance](dialogs-and-media.md#creationdialog-and-error-toast-coexistence).

The adapter uses a readable scrollable stack; native Sonner wrapper options `invert`, `theme`, `swipeDirections`, `gap`, `expand` and `visibleToasts` are unsupported. Do not assume full renderer equivalence when adding a caller. Installed Framer Motion/lucide are reused; no second toast engine or fake success.

## Routed OTP composition

Actual `/register` → GuestRoute → AuthCardLayout → WelcomeLayout → RegisterForm → [RegistrationVerification](../../../apps/web/src/features/auth/components/registration-verification.tsx). `/verify-email` is legacy token-link handling. An isolated CodeSlots fixture omits the shell and cannot establish routed layout.

[Scoped OTP CSS](../../../apps/web/src/features/auth/components/registration-verification.css) owns concise heading, real recipient/email correction, full-width slots/submit, quiet deadline, separated resend/help and back navigation. Code and email errors have distinct IDs/associations; deduplicate exact lock/helper warnings. Cancel returns code focus; resend/email confirmation retains current reset/deadline/refocus lifecycle. Announce expiry/lock changes without announcing each countdown second. Busy/single-flight/security services remain flow-owned; [OTP contract](../../architecture/authentication.md#registration-otp) remains authoritative.

## Auth forms, recovery and token status owners

| Layer | Reused owner | Flow-specific boundary |
| --- | --- | --- |
| Native floating fields | [ui/form-field.tsx](../../../apps/web/src/components/ui/form-field.tsx): input/ref, password reveal, value/label and helper/error association | Each caller chooses autocomplete, field names, disablement and messages. OTP uses CodeSlots. The Controller/context FormField in [ui/form.tsx](../../../apps/web/src/components/ui/form.tsx) is a different owner |
| Forms/validation | RHF `useForm` + `zodResolver`, ordinary explicit forms and `.auth-form` | Schemas/confirmation/username derivation/submit transitions remain local; reset/register8–128 and private change6–100 are distinct accepted API bounds |
| Actions/status | [Button](../../../apps/web/src/components/ui/button.tsx), [auth status CSS](../../../apps/web/src/layouts/welcome-layout.css) | Standard44px submit/link/status actions; semantic heading/message/icon remains small local markup, not a configurable mega-form |
| Requests/errors | [authService](../../../apps/web/src/features/auth/services/auth.service.ts), shared Axios/parseApiError; existing Turnstile hook/component | Identity/navigation, challenge/session lifecycle and request feedback stay with each form; login/register use existing server-error toasts, resume/OTP retain inline local feedback |

[ForgotPasswordForm](../../../apps/web/src/features/auth/components/forgot-password-form.tsx) keeps a persistent described service error, clears on actual retry and focuses the generic privacy-safe receipt on success, without stale competing toasts. [ResetPasswordForm](../../../apps/web/src/features/auth/components/reset-password-form.tsx) retains values on transient failure; only recognized token keys produce persistent neutral failure/recovery. Token-keyed state ignores obsolete/unmounted responses, not an already accepted server operation. [VerifyEmailCard](../../../apps/web/src/features/auth/components/verify-email-card.tsx) is token-keyed, deduplicates its request under StrictMode and clearly confirms completion. No invitation purpose/resend policy is inferred. [GuestRoute](../../../apps/web/src/router/guards/guest-route.tsx) preserves authorization/redirects and omits nonexistent-provider placeholders.

## Focused verification

[Routed OTP](../../../apps/web/tests/registration-verification-browser-check.mjs) and [auth-family](../../../apps/web/tests/auth-family-browser-check.mjs) use the [shared browser entry/options](../../../apps/web/README.md#browser-checks) as `otp` and `auth`. [CodeSlots control](../../../apps/web/tests/code-slots-browser-check.mjs), [SwipeToast](../../../apps/web/tests/swipe-toast-browser-check.mjs) and [individual modal/dirty/busy](../../../apps/web/tests/individual-recognition-browser-check.mjs) retain separate fixture/setup contracts. Synthetic APIs/widget/visibility/keyboard fixtures do not establish actual backend/provider authorization, OS backgrounding, physical autofill/AT or all-browser behavior. [Current status](../../reviews/ux-flow-audit.md) preserves accepted proof limits.
