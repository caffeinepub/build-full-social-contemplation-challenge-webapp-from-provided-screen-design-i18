# Specification

## Summary
**Goal:** Trigger a clean rebuild so the deployed frontend has a new build identifier for cache-busting.

**Planned changes:**
- Generate a new build that updates the HTML meta tag `app-version` at build time so the build version differs from the previous deployment.
- Ensure the rebuilt artifacts can be published to the live environment and reflect the new version when loaded.

**User-visible outcome:** After publishing to live, visiting the live URL loads the updated build (no stale cached bundle) and reflects the new `app-version`.
