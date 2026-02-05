# Specification

## Summary
**Goal:** Fix recording upload/save/get/delete failures by making backend recording logic compatible with the frontend’s assignment IDs and day selection (UI Day 1–7 vs backend Day 0–6).

**Planned changes:**
- Update backend recording assignment validation to accept the frontend assignment IDs used by the app (including at least `awareness` and `utopia`, plus other fixed frontend assignment IDs), preventing “Invalid assignment” traps.
- Normalize day input at the backend boundary so recording operations accept both 0–6 and 1–7 day values and convert to one consistent internal representation.
- Ensure all recording-related backend operations (save/get/delete/getParticipantRecording/getAssignmentRecordings) apply the same day and assignment normalization so saved recordings can be fetched/played and deleted using the same Day/Assignment selection.

**User-visible outcome:** Users can upload recordings for any supported assignment (e.g., “awareness”, “utopia”) and for UI Days 1–7 without errors, and those recordings can be reliably retrieved/played and deleted from the same selections.
