# Specification

## Summary
**Goal:** Make audio uploads work reliably for all five daily assignments by preventing assignment ID mismatches, and remove the erroneous “Migrating your project…” banner from normal app usage.

**Planned changes:**
- Canonicalize assignment identifiers end-to-end so the same canonical IDs are used in frontend and backend for all recording operations (save/upload, get, list incl. team fetch, delete) across the 5 assignments.
- Update backend validation/handling to only accept the canonical assignment IDs used by the UI and eliminate “Invalid assignment” errors for valid uploads.
- Remove/disable the recurring UI banner message “Migrating your project to the new structure. Hold tight — this is a one-time operation.” while preserving legitimate loading/error states.

**User-visible outcome:** Users can upload, see, play, and delete audio recordings for awareness, utopia, small-steps, support-strategies, and other-contemplations for any day (1–7). Recordings appear in “My” and are visible/playable in “Team” for others. The migration status banner no longer appears during normal use.
