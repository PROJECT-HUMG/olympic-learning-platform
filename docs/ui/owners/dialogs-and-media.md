# Dialog and media owners

Shared frames own geometry, focus/Escape and scroll behavior. Feature adapters own permission, media, dirty/busy state and requests. [Control-to-feature lookup](shared-controls.md#interaction-owner-lookup) identifies consumers.

## Current frame ownership

- [Dialog](../../../apps/web/src/components/ui/dialog.tsx): installed Radix modal focus/scroll lock, bounded whole-frame scrolling,44px Close and wrapping minmax grid. Feature width/height overrides remain material; reuse alone does not prove long-content fit.
- [CreationDialog](../../../apps/web/src/components/ui/creation-dialog.tsx) / [CSS](../../../apps/web/src/components/ui/creation-dialog.css): fixed compact heading/Close, shrinking scrolling body, inset/zero-translation centering; narrow/short layouts preserve reachable actions and dirty/busy focus. Outer `overflow:clip` prevents programmatic/focus scrolling from pushing Close offscreen. Do not add a second outer scroll owner or animate centering.
- [AlertDialog](../../../apps/web/src/components/ui/alert-dialog.tsx): bounded whole-frame confirmation scrolling; feature pending guards remain local and Cancel retains the form.
- [EvidenceViewer](../../../apps/web/src/components/ui/evidence-gallery.tsx) / [CSS](../../../apps/web/src/components/ui/evidence-gallery.css): only compact title/Close sticks; long description scrolls with its ARIA relationship, controls/index/filename wrap and zoom retains a separate native image scroller.
- [ImageLightbox](../../../apps/web/src/components/ui/image-lightbox.tsx): contained fullscreen article image with44px Close and opener focus return. Physical browser/notch geometry is not established by a synthetic viewport.
- Daily native group creation retains its own lifecycle. Study Room uses a deliberately activated inline player, with no separate music modal; room membership/navigation owns teardown.

## CreationDialog and error-toast coexistence

[sonner.css](../../../apps/web/src/components/ui/sonner.css) owns the bounded top-right toast gutter while CreationDialog is open. Preserve Close clearance on narrow/short screens, readable error feedback, focus and busy/dirty/nested dismissal. SwipeToast retains this geometry contract. If frame/Close sizing changes, verify both owners together.

## Recognition DepthCarousel and evidence capability

[DepthCarousel](../../../apps/web/src/components/react-bits/depth-carousel.tsx) adapts free `DepthCarousel-TS-CSS` for [HonorGallery](../../../apps/web/src/features/recognition/honor-gallery.tsx) and [AchievementEvidence](../../../apps/web/src/features/recognition/achievement-evidence.tsx). Preserve real image order, perspective/depth rail, horizontal touch/keyboard navigation and44px controls; no autoplay, vertical wheel hijack, stock images or guessed URLs. Installed scoped GSAP owns transforms/cleanup, Radix owns dialog focus/Escape; frame centering is separate.

EvidenceViewer's optional image-gallery slot does not change Daily's default viewer or authorization. Recognition owner/admin identity/refetch/expiry/version gates authorize private blob bytes; abort/revoke/raster-signature checks and original download remain feature-owned. Public album photo queries may be explicitly public; management photos remain private. Profile/achievement visibility does not expose evidence.

**Recognition evidence has no PDF first-page preview contract.** Documents separately supply Cloudinary DOCUMENT PDF `thumbnailUrl` under the permitted `documents/{uuid}.pdf` public namespace. [DocumentServiceImpl](../../../apps/api/src/main/java/me/nghlong3004/olympic/document/service/impl/DocumentServiceImpl.java) / [CloudinaryStorageService](../../../apps/api/src/main/java/me/nghlong3004/olympic/storage/service/impl/CloudinaryStorageService.java) do not invent private/authenticated thumbnail delivery. Recognition supplies ID/name/type/size and authenticated original bytes, with no installed PDF.js/react-pdf renderer or accepted thumbnail endpoint. Nonimages remain truthful file/unsupported/error states with authorized original download, not images.

## Focused verification

[Recognition media](../../../apps/web/tests/recognition-media-browser-check.mjs) uses `media` in the [shared browser entry/options](../../../apps/web/README.md#browser-checks). [Individual evidence/modal](../../../apps/web/tests/individual-recognition-browser-check.mjs) and [scroll/dialog](../../../apps/web/tests/scroll-dialog-browser-check.mjs) retain separate setup. Include320px/short screens, long filenames/titles, toast plus touch Close, keyboard/Escape/focus, dirty/busy and nested controls. Fixtures establish frontend behavior, not deployed bytes/privacy enforcement, real media quality, physical browser chrome or AT speech.
