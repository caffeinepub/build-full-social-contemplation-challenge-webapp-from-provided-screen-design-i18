# Specification

## Summary
**Goal:** Fix the production “Invalid assignment” recording errors by adding a frontend-only assignment ID compatibility fallback (hyphenated ↔ underscore), while keeping existing UI assignment labels unchanged.

**Planned changes:**
- Add a frontend compatibility layer for all recording-related API calls to retry once with the alternate assignment ID format when the backend returns an error containing `Invalid assignment:`.
- Keep one canonical assignment ID set inside the frontend for rendering/state, and normalize assignment IDs used in React Query cache keys to avoid duplicate cache entries across ID variants.
- Add lightweight frontend diagnostic console logging when the invalid-assignment retry path triggers (original ID, fallback ID, sanitized error, and whether retry succeeded), without logging sensitive user data.
- Ensure any user-facing error is shown once in English only if both the original attempt and fallback retry fail.

**User-visible outcome:** In production, saving/sharing/fetching/deleting recordings works even when the backend expects legacy assignment IDs, and users no longer get stuck on “Invalid assignment” for these operations while seeing the same assignment titles/labels as before.
