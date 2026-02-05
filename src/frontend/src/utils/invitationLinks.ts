/**
 * Utility functions for creating and parsing shareable invitation links.
 * Updated to preserve app navigation state tokens and persist invitation params.
 */

const INVITATION_STORAGE_KEY = 'pendingInvitation';

/**
 * Builds a shareable invitation URL from the current location.
 * Preserves the full app path (including subpaths and hash routing) and adds only challengeId and code query params.
 * @param challengeId - The challenge ID
 * @param code - The invitation code
 * @returns A complete URL with query parameters
 */
export function buildInvitationLink(challengeId: bigint, code: string): string {
  const url = new URL(window.location.href);
  
  // Clear any existing invitation params first
  url.searchParams.delete('challengeId');
  url.searchParams.delete('code');
  
  // Add the new invitation params
  url.searchParams.set('challengeId', challengeId.toString());
  url.searchParams.set('code', code);
  
  return url.toString();
}

/**
 * Parses invitation parameters from the current URL.
 * @returns An object with challengeId and code, or null if not present
 */
export function parseInvitationFromURL(): { challengeId: bigint; code: string } | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const challengeIdStr = params.get('challengeId');
    const code = params.get('code');

    if (challengeIdStr && code) {
      return {
        challengeId: BigInt(challengeIdStr),
        code,
      };
    }
  } catch (error) {
    console.error('Failed to parse invitation from URL:', error);
  }
  return null;
}

/**
 * Clears invitation parameters from the URL without reloading the page.
 * Preserves app navigation state tokens (screen, tab, day, etc.).
 */
export function clearInvitationFromURL(): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('challengeId');
    url.searchParams.delete('code');
    window.history.replaceState({}, '', url.toString());
  } catch (error) {
    console.error('Failed to clear invitation from URL:', error);
  }
}

/**
 * Persists invitation parameters to sessionStorage for auto-redeem flow.
 * @param params - The invitation parameters to persist
 */
export function persistInvitationParams(params: { challengeId: bigint; code: string }): void {
  try {
    sessionStorage.setItem(INVITATION_STORAGE_KEY, JSON.stringify({
      challengeId: params.challengeId.toString(),
      code: params.code,
    }));
  } catch (error) {
    console.error('Failed to persist invitation params:', error);
  }
}

/**
 * Retrieves persisted invitation parameters from sessionStorage.
 * @returns The persisted invitation parameters, or null if not found
 */
export function getPersistedInvitationParams(): { challengeId: bigint; code: string } | null {
  try {
    const stored = sessionStorage.getItem(INVITATION_STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    if (!parsed || !parsed.challengeId || !parsed.code) return null;
    
    return {
      challengeId: BigInt(parsed.challengeId),
      code: parsed.code,
    };
  } catch (error) {
    console.error('Failed to retrieve persisted invitation params:', error);
    return null;
  }
}

/**
 * Clears persisted invitation parameters from sessionStorage.
 */
export function clearPersistedInvitationParams(): void {
  try {
    sessionStorage.removeItem(INVITATION_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear persisted invitation params:', error);
  }
}

/**
 * Checks if there is a pending invitation in sessionStorage.
 * @returns true if a pending invitation exists, false otherwise
 */
export function hasPendingInvitation(): boolean {
  return getPersistedInvitationParams() !== null;
}
