# Specification

## Summary
**Goal:** Complete the in-active-challenge Manage Challenge screen (Step 6), add the in-challenge tab shell (Step 7), fix routing between them, and remove the recurring bogus “Migrating…” UI message.

**Planned changes:**
- Implement Step 6 “Manage Challenge” screen to match the provided reference screenshot 1:1 (header/subtitle, spacing, card styling, icons, layout), including a top-left close (X).
- Add a Participants card with a refresh action and an empty-state message when there are no participants.
- Add a destructive “Leave Challenge” card with a prominent full-width “Leave Challenge” button.
- Render the existing “Social Contemplation” and “About the Challenge” scrollable info dialogs on Step 6 using the shared InfoPopups component (same popup behavior as Screens 1 & 3).
- Fix state-based routing so authenticated users with an active challenge land on Step 6 by default, and add an obvious UI navigation path to go Step 6 ↔ Step 7 (without relying on URL routing).
- Build/finish Step 7 as a clean tabbed shell with exactly three tabs (My / Team / Coming Soon) and visual styling consistent with the existing screen family (Screens 1/3/5).
- Remove/disable the erroneous recurring UI message “Migrating your project to the new structure. Hold tight — this is a one-time operation.” and replace any surfaced occurrences with a generic, user-friendly error message.

**User-visible outcome:** Logged-in users who are in an active challenge are taken to a polished Manage Challenge screen, can open the same info popups as other screens, can navigate into and back from a 3-tab in-challenge view, and no longer see the recurring “Migrating…” message.
