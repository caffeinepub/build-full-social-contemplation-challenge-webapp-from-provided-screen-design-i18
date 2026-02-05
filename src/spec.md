# Specification

## Summary
**Goal:** Ensure audio recordings are only shared with same-challenge participants after an explicit Yes/No confirmation, and update Team view to show only shared recordings.

**Planned changes:**
- Add backend support for challenge-scoped recording visibility, distinguishing between private saved recordings and recordings explicitly shared to the team (same challenge participants only).
- Implement backend APIs to (1) mark a caller’s saved recording as shared for a specific (challengeId, day, assignment) and (2) fetch a participant’s shared recording for a specific (challengeId, day, assignment), enforcing same-challenge access only.
- Add a frontend Yes/No confirmation modal in the recording save flow to choose whether to share with the team; “No” saves privately, “Yes” saves and shares.
- Update the Team tab UI to browse recordings by participant, then day, then exercise/assignment, showing only shared recordings and behaving as if unshared recordings do not exist.
- Ensure deletion removes access to any previously shared version of the deleted recording for other participants, and updates the owner’s “My” tab accordingly.

**User-visible outcome:** When saving a new recording, users must confirm (Yes/No) whether to share it with their challenge team; the Team tab shows and plays only recordings that participants explicitly shared, and deleted recordings disappear for everyone.
