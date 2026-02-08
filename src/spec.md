# Specification

## Summary
**Goal:** Rebuild the full challenge audio recording flow (select assignment → record → review → confirm share choice → upload/save → optional share toggle → visible in Team tab) so it works reliably end-to-end, while keeping authentication, navigation, and account management unchanged.

**Planned changes:**
- Replace the existing challenge recording flow with a single, reliable end-to-end path covering record, review, share confirmation, upload/save, and retrieval/playback.
- Backend: refactor and clean up the challenge recordings API/storage in the single Motoko actor to enforce consistent validation (auth, membership, day range) and canonical assignment/day handling, and to support save, share-status update, delete, and fetch operations for My/Team views.
- Frontend: rebuild “My” recording cards and upload handler to use only canonical assignment IDs and consistent day-index conversion utilities; show upload progress and surface errors without leaving the UI stuck.
- Frontend: harden the share confirmation step to trigger exactly one upload attempt, prevent bypass via UI state glitches, and block duplicate submissions while an upload is in progress.
- Frontend: rebuild/verify Team tab to show only shared recordings, provide clear English empty states, and ensure reliable audio playback lifecycle behavior.

**User-visible outcome:** Users can record audio for a chosen challenge day/assignment, review it, choose whether to share, upload/save without silent failures, replay saved recordings, and (if shared) have recordings appear correctly for other participants in the Team tab; auth/navigation/account behavior stays the same.
