import { useEffect, useState } from 'react';
import { checkVersion } from '../utils/versionCheck';
import { performHardRefresh, clearRefreshProtection } from '../utils/hardRefresh';

const SESSION_KEY_PREFIX = 'app-update-guard-refreshed-';

/**
 * Hook that runs once on app startup to check for version mismatches.
 * If a mismatch is detected, triggers a one-time forced refresh with loop prevention.
 * Returns whether the app is currently updating (about to refresh).
 */
export function useAppUpdateGuard(): { isUpdating: boolean } {
  const [isUpdating, setIsUpdating] = useState(false);
  
  useEffect(() => {
    let mounted = true;
    
    async function checkAndRefresh() {
      try {
        // Check version
        const versionResult = await checkVersion();
        
        if (!mounted) return;
        
        const { needsRefresh, runningVersion, latestVersion } = versionResult;
        
        if (!needsRefresh) {
          // No refresh needed - clear any stale protection flags
          clearRefreshProtection();
          
          // Also clear any per-version session flags when versions match
          if (runningVersion) {
            const sessionKey = `${SESSION_KEY_PREFIX}${runningVersion}`;
            sessionStorage.removeItem(sessionKey);
          }
          
          return;
        }
        
        // Log mismatch with full diagnostics
        console.log('[AppUpdateGuard] Version mismatch detected:', {
          runningVersion,
          latestVersion,
        });
        
        // Check if we've already refreshed for this version in this session
        if (runningVersion) {
          const sessionKey = `${SESSION_KEY_PREFIX}${runningVersion}`;
          const alreadyRefreshed = sessionStorage.getItem(sessionKey);
          
          if (alreadyRefreshed === 'true') {
            console.log('[AppUpdateGuard] Already refreshed for this version, skipping');
            return;
          }
          
          // Mark that we're about to refresh for this version
          sessionStorage.setItem(sessionKey, 'true');
        }
        
        // Show updating UI
        setIsUpdating(true);
        
        // Wait a brief moment for the UI to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Perform hard refresh
        performHardRefresh('version-mismatch');
      } catch (error) {
        console.error('[AppUpdateGuard] Error during update check:', error);
      }
    }
    
    // Run the check on mount
    checkAndRefresh();
    
    return () => {
      mounted = false;
    };
  }, []); // Run once on mount
  
  return { isUpdating };
}
