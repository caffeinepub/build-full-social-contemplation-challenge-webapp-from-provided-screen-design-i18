# Specification

## Summary
**Goal:** Polish navigation state restoration, popup consistency, and responsive behavior so the app reliably returns to the same screen/subview after refresh and remains usable across devices.

**Planned changes:**
- Add explicit URL tokens synchronized with the app’s existing state-based navigation so a page refresh restores the current screen and key subview selections (not defaults), including Screen 6 tab and subview state.
- Ensure URL token updates happen via history push/replace without full reloads and without breaking existing invitation-link parsing.
- Introduce a single shared popup/dialog abstraction (wrapping existing UI primitives) and refactor existing popups (InfoPopups on Screens 3 & 5, assignment detail popups on Screen 6) to use it for consistent sizing, scrolling, closing, focus, and RTL alignment.
- Perform mobile-first responsive checks and adjust layouts for Screens 1, 3, 4, 5, and 6 to prevent overflow/clipping and keep core actions accessible across common breakpoints.

**User-visible outcome:** Refreshing the page returns users to the exact same screen/tab/subview (especially on Screen 6), popups behave the same everywhere, and all primary screens and dialogs remain readable and usable on mobile, tablet, and desktop.
