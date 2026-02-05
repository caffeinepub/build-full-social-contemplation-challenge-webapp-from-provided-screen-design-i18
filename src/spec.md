# Specification

## Summary
**Goal:** Fix the audio recording Save → “Share with team?” → Yes flow so recordings reliably upload/save and share with the team (including from Caffeine draft domains), and users get clear error feedback when something fails.

**Planned changes:**
- Backend: Update recording upload/storage origin allowlisting to explicitly permit the frontend origins used by Caffeine deployments (including `https://*.caffeine.xyz`) while keeping origin validation enabled.
- Frontend: Ensure the Save → share-confirmation → Yes path properly completes the upload/save and then marks the recording as shared.
- Frontend: Add user-facing English error handling for save/share failures (including a specific message for “disallowed origin”) and reset UI state so the dialog closes and users can retry without refresh.

**User-visible outcome:** After recording audio in the “My” tab, users can click Save and confirm sharing; the recording is saved and playable for the day, and if “Yes” is chosen it becomes visible/playable for other participants in the Team tab—even when the app is opened on a Caffeine draft domain. If something goes wrong, users see a clear English error message and can try again.
