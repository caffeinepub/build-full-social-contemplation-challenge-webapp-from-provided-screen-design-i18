# Specification

## Summary
**Goal:** Fix recording upload/get/delete issues by making day indexing (UI Day 1–7) and assignment identifiers consistent across frontend and backend, while keeping backward compatibility for previously stored recordings.

**Planned changes:**
- Backend: normalize all recording operations to a single canonical day-key scheme (store/look up days as 0–6; UI Day 1 => 0, Day 7 => 6) and ensure no collisions/off-by-one errors across save/get/delete/list endpoints.
- Backend: add backward-compatible lookup/delete handling for recordings stored under legacy day keys so previously uploaded recordings can still be retrieved and deleted.
- Backend: normalize/validate assignment identifiers so the canonical IDs work (awareness, utopia, small-steps, support-strategies, other-contemplations) and legacy IDs (e.g., assignment1–assignment5) remain supported for existing data.
- Frontend: align upload/get/delete/team playback calls to use the same canonical day and assignment IDs, and update React Query invalidation/refetch so UI state updates immediately after upload/delete; keep user-facing recording errors in English.

**User-visible outcome:** Users can upload, view/play back, and delete recordings for any of the five assignments on any day; after upload/delete the UI immediately reflects the correct recorded/unrecorded state without needing a manual refresh, and previously uploaded recordings remain accessible/deletable.
