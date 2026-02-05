/**
 * Shared utility for performing cache-busted hard refreshes.
 * Used by both the app update guard and in-app error recovery flows.
 */

const LOOP_PROTECTION_KEY = 'hard-refresh-attempted';

/**
 * Performs a cache-busted hard refresh with loop protection.
 * Uses location.replace to avoid adding to browser history.
 * 
 * @param reason - Optional reason for logging (e.g., 'version-mismatch', 'invalid-assignment')
 */
export function performHardRefresh(reason?: string): void {
  try {
    // Check if we've already attempted a refresh recently (within last 5 seconds)
    const lastAttempt = sessionStorage.getItem(LOOP_PROTECTION_KEY);
    if (lastAttempt) {
      const timeSinceLastAttempt = Date.now() - parseInt(lastAttempt, 10);
      if (timeSinceLastAttempt < 5000) {
        console.warn('[HardRefresh] Skipping refresh - too soon since last attempt');
        return;
      }
    }
    
    // Mark this refresh attempt
    sessionStorage.setItem(LOOP_PROTECTION_KEY, Date.now().toString());
    
    console.log(`[HardRefresh] Performing cache-busted reload${reason ? ` (reason: ${reason})` : ''}`);
    
    // Create a cache-busting URL
    const cacheBuster = `_cb=${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const currentUrl = new URL(window.location.href);
    
    // Add cache-busting param (replace if it already exists)
    currentUrl.searchParams.set('_cb', cacheBuster);
    
    // Use location.replace to avoid adding to history
    window.location.replace(currentUrl.toString());
  } catch (error) {
    console.error('[HardRefresh] Failed to perform hard refresh:', error);
    // Fallback to simple reload
    window.location.reload();
  }
}

/**
 * Clears the loop protection flag.
 * Should be called after successful app initialization.
 */
export function clearRefreshProtection(): void {
  sessionStorage.removeItem(LOOP_PROTECTION_KEY);
}
