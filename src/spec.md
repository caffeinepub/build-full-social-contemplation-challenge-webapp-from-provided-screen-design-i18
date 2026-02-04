# Specification

## Summary
**Goal:** Provide clear, prominent live feedback during audio recording on Screen 6 (My tab) so users can confidently see that recording is active.

**Planned changes:**
- Add a large in-recording focus UI in Screen 6 that appears only while an assignment is actively recording, showing a live animated waveform/level meter, a REC indicator, an elapsed timer, and short reassuring English microcopy.
- Extend the existing `useAudioRecording` hook to expose minimal additional live-feedback state (mic level and elapsed seconds) using the Web Audio API (AnalyserNode), with proper cleanup of tracks/audio context/analyser on stop and unmount, and reset on new recordings.
- Integrate the feedback UI into the current Screen 6 recording flow so it is tied to the active `recordingAssignment` and does not change existing stop/save/upload behavior or overwrite prevention.
- Add any new user-facing strings to the i18n translation system and ensure English translations exist for all new keys, including correct rendering in both LTR and RTL layouts.

**User-visible outcome:** When the user records an assignment in Screen 6, a big, animated recording indicator appears with a live meter/waveform, REC status, and a running timer (plus reassuring text), then disappears when recording stops without changing existing save/upload behavior.
