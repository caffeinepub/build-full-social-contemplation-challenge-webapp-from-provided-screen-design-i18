# Specification

## Summary
**Goal:** Prevent live white-screen issues caused by stale cached frontend assets by ensuring a real build version is generated/injected, with a safe runtime fallback and minimal in-app diagnostics.

**Planned changes:**
- Ensure each production build generates a concrete, unique frontend build version and injects it into both `meta[name="app-version"]` and `frontend/src/generated/appVersion.ts` (bundled equivalent), avoiding placeholder values.
- Add a runtime fallback: if the compiled build version is still a placeholder at startup, stamp `meta[name="app-version"]` with a newly generated unique value so the update guard can detect and recover from stale assets (without creating a refresh loop).
- Add minimal developer-only diagnostics in an existing developer area to display the stamped `runningVersion` (from the meta tag) and the compiled `BUILD_VERSION`, with all new UI text in English.

**User-visible outcome:** On live deployments, the app reliably detects stale cached frontend assets and can trigger safe cache-busting refresh behavior; developers can confirm the running/compiled version from an in-app developer-only view.
