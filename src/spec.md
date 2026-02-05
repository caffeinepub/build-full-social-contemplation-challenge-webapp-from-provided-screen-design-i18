# Specification

## Summary
**Goal:** Provide reliable live input level (VU meter) feedback during recording and remove the waveform visualization so users don’t see an empty/black waveform area.

**Planned changes:**
- Remove the waveform UI from the recording and post-record review states so no waveform canvas/placeholder is shown.
- Ensure a clearly visible real-time recording level meter is displayed during recording and updates multiple times per second based on microphone input, including on iOS/Safari (resume/start audio analysis from the “Start Recording” user gesture when required).
- Simplify the recording hook/component interfaces by removing waveform-related state and logic so waveform samples are no longer computed or stored, while keeping recorded audio playback and upload behavior unchanged.

**User-visible outcome:** While recording, users see a responsive live level meter that confirms audio is coming in, and they no longer see a black/empty waveform area; recording, review, and upload continue to work as before.
