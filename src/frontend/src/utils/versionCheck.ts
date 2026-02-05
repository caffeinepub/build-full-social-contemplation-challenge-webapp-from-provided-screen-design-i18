import { getRunningAppVersion, extractVersionFromHTML } from './appVersion';

export interface VersionCheckResult {
  needsRefresh: boolean;
  runningVersion: string | null;
  latestVersion: string | null;
}

/**
 * Checks if the running app version matches the latest deployed version.
 * Fetches the entry HTML with cache-busting headers and compares versions.
 * Returns structured diagnostics for logging and decision-making.
 */
export async function checkVersion(): Promise<VersionCheckResult> {
  try {
    const runningVersion = getRunningAppVersion();
    
    // If we can't determine the running version, don't force refresh
    if (!runningVersion) {
      console.log('[VersionCheck] No running version found, skipping check');
      return {
        needsRefresh: false,
        runningVersion: null,
        latestVersion: null,
      };
    }
    
    // Fetch the latest entry HTML with aggressive cache-busting
    const cacheBuster = `v=${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const response = await fetch(`/?${cacheBuster}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    
    if (!response.ok) {
      console.warn('[VersionCheck] Failed to fetch latest version:', response.status);
      return {
        needsRefresh: false,
        runningVersion,
        latestVersion: null,
      };
    }
    
    const html = await response.text();
    const latestVersion = extractVersionFromHTML(html);
    
    if (!latestVersion) {
      console.log('[VersionCheck] No latest version found in fetched HTML');
      return {
        needsRefresh: false,
        runningVersion,
        latestVersion: null,
      };
    }
    
    const needsRefresh = runningVersion !== latestVersion;
    
    // Log comparison with both versions
    if (needsRefresh) {
      console.log('[VersionCheck] Version mismatch detected:', {
        runningVersion,
        latestVersion,
      });
    } else {
      console.log('[VersionCheck] Versions match:', {
        runningVersion,
        latestVersion,
      });
    }
    
    return {
      needsRefresh,
      runningVersion,
      latestVersion,
    };
  } catch (error) {
    console.error('[VersionCheck] Error during version check:', error);
    return {
      needsRefresh: false,
      runningVersion: getRunningAppVersion(),
      latestVersion: null,
    };
  }
}

/**
 * Legacy wrapper for backwards compatibility.
 * @deprecated Use checkVersion() instead for structured results.
 */
export async function shouldForceRefresh(): Promise<boolean> {
  const result = await checkVersion();
  return result.needsRefresh;
}
