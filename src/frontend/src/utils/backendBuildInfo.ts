/**
 * Frontend-only cache for backend build information.
 * Stores the latest fetched backend build identifier to help diagnose
 * frontend↔backend mismatches in upload failures and other operations.
 */

import type { BuildInfo } from '../backend';

// Module-level store for backend build info
let cachedBuildInfo: BuildInfo | null = null;

/**
 * Store the backend build info fetched from the actor.
 */
export function setBackendBuildInfo(buildInfo: BuildInfo): void {
  cachedBuildInfo = buildInfo;
  console.log('[BackendBuildInfo] Cached backend build info:', {
    version: buildInfo.version,
    buildTime: buildInfo.buildTime.toString(),
    deployTime: buildInfo.deployTime.toString(),
    stableDeployTime: buildInfo.stableDeployTime?.toString() || 'none',
  });
}

/**
 * Get the cached backend build info.
 * Returns null if not yet fetched.
 */
export function getBackendBuildInfo(): BuildInfo | null {
  return cachedBuildInfo;
}

/**
 * Get a short identifier string for the backend build.
 * Returns a human-readable string combining version and deploy time.
 */
export function getBackendBuildIdentifier(): string {
  if (!cachedBuildInfo) {
    return 'unknown';
  }
  
  // Use deploy time as the primary identifier (most recent deployment)
  const deployTime = cachedBuildInfo.deployTime.toString();
  const version = cachedBuildInfo.version;
  
  return `${version}-${deployTime.slice(0, 10)}`;
}

/**
 * Clear the cached backend build info.
 * Useful when logging out or resetting state.
 */
export function clearBackendBuildInfo(): void {
  cachedBuildInfo = null;
}
