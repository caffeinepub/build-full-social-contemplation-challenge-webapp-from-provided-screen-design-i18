# Specification

## Summary
**Goal:** Redeploy the live app and ensure the production frontend serves a correctly stamped, non-placeholder build version to prevent stale asset issues.

**Planned changes:**
- Redeploy the application to the live environment and confirm the deployment completes successfully and the app loads normally afterward.
- Ensure the production build stamps a concrete, unique build version into the deployed HTML as `meta[name="app-version"]` (non-empty, not a placeholder).
- Ensure `frontend/src/generated/appVersion.ts` exports a concrete `BUILD_VERSION` value at runtime (never a placeholder string).
- Verify the existing Developer Panel (`?dev=true`) displays the stamped meta-tag version and the compiled build version for troubleshooting, and that they match when stamping works.

**User-visible outcome:** After redeploy, the live app loads without a persistent blank/spinner state, and developers can reliably see and compare runtime/compiled version info (via `?dev=true`) to diagnose stale frontend assets.
