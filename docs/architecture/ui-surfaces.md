---
last_updated: 2026-07-28
owner: Olympic Engineering
status: Approved
title: UI Surfaces Guidelines
version: 1
---

# UI Surfaces Guidelines

This document outlines the usage and implementation guidelines for various floating UI surfaces such as Modal Dialogs, Drawers, and Bottom Sheets.

## Modal Dialogs

**Implementation:**
Use a Modal Dialog built with the native `<dialog>` HTML element and open it using `HTMLDialogElement.showModal()`. 

**Benefits:**
- **Top Layer:** The browser automatically places it in the native top layer (above all other z-index elements).
- **Inert Background:** It makes the page behind it inert, preventing interaction with underlying content out of the box.
- **Backdrop Styling:** It provides the native `::backdrop` pseudo-element for styling the overlay.
- **Accessibility:** It provides out-of-the-box support for the `Escape` key to close the dialog and native focus trapping.

## Drawers and Sheets

While Modal Dialogs are great for critical alerts, simple confirmations, or focused tasks, use other surfaces for different contexts:

### Side Drawers
Use a side Drawer for **contextual editing**. Drawers slide in from the edge of the screen and are ideal when you want to keep the main content contextually relevant and partially visible while providing an extended area for complex configurations or long forms.

### Bottom Sheets
Use a bottom Sheet for **compact or mobile actions**. Bottom sheets provide an ergonomic, thumb-friendly surface for quick actions, menus, or selections on mobile devices.

## Scrim and Focus Management

**Rule of Thumb:** Add a scrim (backdrop overlay) and implement modal focus management **only** when these surfaces are actually intended to be *modal*. 

If a Drawer or Sheet is non-modal (e.g., the user is expected to interact with the underlying page simultaneously without closing the drawer), do not block background interaction with a scrim and do not trap the keyboard focus inside the surface.
