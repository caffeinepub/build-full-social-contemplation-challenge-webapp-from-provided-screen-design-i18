# Specification

## Summary
**Goal:** Remove all audio file upload UI and ensure the in-app microphone recorder flow is the only active, usable way to provide audio.

**Planned changes:**
- Hide/disable/remove any file-input based audio upload controls across the app (e.g., file picker, “Upload” button intended for selecting a local file).
- Ensure the in-challenge recorder flow supports start recording, stop recording, playback review, and proceeding with the existing send/save/share action.
- Update user-facing UI text so no control in the recorder flow is labeled “Upload” (use English UI text).

**User-visible outcome:** Users can record audio in-app with the microphone, review the recording, and proceed with the existing action to send it—without any visible option to upload a local audio file and without any “Upload” button label in the recorder UI.
