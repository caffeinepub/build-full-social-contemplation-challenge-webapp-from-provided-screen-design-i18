/**
 * Challenge deleted notice state helper.
 * Uses sessionStorage to persist notice state across navigation.
 */

const NOTICE_STORAGE_KEY = 'social_contemplation_challenge_deleted_notice';

/**
 * Set the challenge deleted notice flag.
 */
export function setChallengeDeletedNotice(): void {
  try {
    sessionStorage.setItem(NOTICE_STORAGE_KEY, 'true');
  } catch (error) {
    console.error('Failed to set challenge deleted notice:', error);
  }
}

/**
 * Check if the challenge deleted notice should be shown.
 */
export function hasChallengeDeletedNotice(): boolean {
  try {
    return sessionStorage.getItem(NOTICE_STORAGE_KEY) === 'true';
  } catch (error) {
    console.error('Failed to check challenge deleted notice:', error);
    return false;
  }
}

/**
 * Clear the challenge deleted notice flag.
 */
export function clearChallengeDeletedNotice(): void {
  try {
    sessionStorage.removeItem(NOTICE_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear challenge deleted notice:', error);
  }
}
