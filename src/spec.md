# Specification

## Summary
**Goal:** Make “Manage Challenge” reliably support a save-to-create/update flow, and only show Invitations/Participants after a successful save, including recovery from stale persisted challenge state.

**Planned changes:**
- Add a primary button labeled exactly **"Save"** to the Start Date section on Manage Challenge.
- Implement create/update behavior on Save:
  - If no active challenge exists, Save creates a new challenge using the selected start date.
  - If an active challenge exists and the user is the creator, Save updates the start date (respecting the existing Day-1 restriction).
- Hide **Invitations** and **Participants** sections until Save succeeds and a confirmed active challenge ID exists.
- Fix stale “managed challenge” state: when the backend responds with “Challenge not found” for the resolved challengeId, clear the persisted active challenge context (sessionStorage) and re-render Manage Challenge in create mode (Start Date + Save only).
- Ensure there is a clear “Create challenge” entry point from the no-active-challenge experience that opens Manage Challenge in create mode and does not create anything until Save is pressed.

**User-visible outcome:** Users can open Manage Challenge in create mode, pick a start date, and press **Save** to create a challenge; only after saving do invitations and participants become available, and stale/broken saved state no longer blocks challenge creation.
