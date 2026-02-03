/**
 * Challenge context persistence utility.
 * Stores and retrieves the last known active challenge ID in sessionStorage
 * so Screen 4 can resolve challenge context after refresh for non-creators.
 */

const STORAGE_KEY = 'social_contemplation_active_challenge_id';

export function persistActiveChallengeId(challengeId: bigint): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, challengeId.toString());
  } catch (error) {
    console.error('Failed to persist challenge ID:', error);
  }
}

export function getPersistedActiveChallengeId(): bigint | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return BigInt(stored);
    }
  } catch (error) {
    console.error('Failed to retrieve persisted challenge ID:', error);
  }
  return null;
}

export function clearPersistedActiveChallengeId(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear persisted challenge ID:', error);
  }
}
