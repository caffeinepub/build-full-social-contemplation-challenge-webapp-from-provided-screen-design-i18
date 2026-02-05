# Specification

## Summary
**Goal:** Fix production stale-asset caching that causes invalid assignment upload errors by ensuring unique build versioning, robust update detection, and a safe one-time hard refresh flow.

**Planned changes:**
- Ensure each production build injects a unique, non-placeholder app version into the rendered HTML (e.g., via `<meta name="app-version" ...>`) and make it reliably readable at runtime for update detection.
- Harden the version-mismatch forced-refresh flow to perform an aggressive, cache-busted one-time reload (including cache-busted version-check requests) while preventing refresh loops.
- On upload failures where the backend error contains “Invalid assignment”, show a clear English recovery message and provide an in-app “hard refresh” action that triggers a cache-busted reload.
- Add lightweight, non-sensitive diagnostics: log running app version and latest fetched app version on mismatch; log running app version (if available) and the attempted assignment value on invalid-assignment upload errors.

**User-visible outcome:** After a new deploy, users reliably receive the latest frontend without getting stuck on stale cached assets; if a stale-asset “Invalid assignment” upload error occurs, the app clearly instructs the user and provides an in-app hard refresh button to recover.
