/**
 * Utility functions for creating and parsing shareable invitation links.
 */

/**
 * Builds a shareable invitation URL from the current origin.
 * @param challengeId - The challenge ID
 * @param code - The invitation code
 * @returns A complete URL with query parameters
 */
export function buildInvitationLink(challengeId: bigint, code: string): string {
  const url = new URL(window.location.origin);
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
