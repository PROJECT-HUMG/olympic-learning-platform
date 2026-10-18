# UI ownership

Start with [the named-feature lookup](../README.md#feature-lookup) for a screen. Read [HUMG UI rules](../architecture/web-ui.md) before changing typography/colors/composition, then open only the relevant owner below.

| Task | Current owner guide |
| --- | --- |
| Width/gutters/headings, public/workspace navigation, list search/IME/URL, Documents mobile filters, News rows | [Layout and discovery](owners/layout-and-discovery.md) |
| Frames/focus/nested controls; shared auth fields/actions/status; OTP/CodeSlots; Sonner/SwipeToast | [Shared controls](owners/shared-controls.md), [routed OTP](owners/shared-controls.md#routed-otp-composition), [auth forms](owners/shared-controls.md#auth-forms-recovery-and-token-status-owners) |
| Modal geometry/scroll, reachable Close beside toasts, protected media, album DepthCarousel, PDF capability | [Dialogs and media](owners/dialogs-and-media.md) |
| Avatar/name/profile navigation, Recognition summary/ranks, real evidence selection/upload | [Identity and Recognition](owners/identity-and-recognition.md), [avatar storage/crop](owners/identity-and-recognition.md#avatar-crop-and-storage-contract) |
| Home surfaces/MaskedHeading/tabs/utility links, static logo/theme videos, account menu/share actions and startup opacity | [Home and motion](owners/home-registry-and-motion.md) |

Feature adapters own data, permissions, drafts, dirty/busy, query state and real service errors. Shared frames/styles never redefine them. Room player lifecycles, auth scenes/mobile shell, scientific editors/frozen readers and ordinary data screens intentionally differ.

The Documents card decision remains open: keep honest “Chưa có ảnh”; improve oversized/isolated missing-preview space only when that composition change is authorized. Do not treat a previous suggestion as an implemented requirement.

Owner guides link focused executable checks. [Current status](../reviews/ux-flow-audit.md) records checkpoint/pending state and material evidence limits; Git retains old execution/adoption logs. Do not create a second tracker or retain stale compatibility inventories. Update the responsible guide when a current contract changes.
