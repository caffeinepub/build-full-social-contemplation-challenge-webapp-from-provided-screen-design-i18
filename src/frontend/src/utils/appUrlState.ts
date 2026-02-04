/**
 * Utility for managing app navigation state via URL tokens without a router framework.
 * Preserves invitation parameters (challengeId/code) until explicitly cleared.
 */

export interface AppUrlState {
  screen?: string;
  tab?: string;
  day?: string;
  participant?: string;
  participantDay?: string;
}

/**
 * Reads app state from URL search parameters.
 */
export function readAppUrlState(): AppUrlState {
  const params = new URLSearchParams(window.location.search);
  return {
    screen: params.get('screen') || undefined,
    tab: params.get('tab') || undefined,
    day: params.get('day') || undefined,
    participant: params.get('participant') || undefined,
    participantDay: params.get('participantDay') || undefined,
  };
}

/**
 * Writes app state to URL search parameters without reloading the page.
 * Preserves all other query parameters (e.g., invitation params).
 */
export function writeAppUrlState(state: AppUrlState): void {
  try {
    const url = new URL(window.location.href);
    
    // Update or remove each state parameter
    Object.entries(state).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      } else {
        url.searchParams.delete(key);
      }
    });
    
    window.history.replaceState({}, '', url.toString());
  } catch (error) {
    console.error('Failed to write app URL state:', error);
  }
}

/**
 * Clears all app state parameters from the URL without affecting other params.
 */
export function clearAppUrlState(): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('screen');
    url.searchParams.delete('tab');
    url.searchParams.delete('day');
    url.searchParams.delete('participant');
    url.searchParams.delete('participantDay');
    window.history.replaceState({}, '', url.toString());
  } catch (error) {
    console.error('Failed to clear app URL state:', error);
  }
}
