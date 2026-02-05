/**
 * Assignment ID compatibility utility for handling legacy backend variants.
 * 
 * The backend accepts both hyphenated (daily-check-in) and underscored (daily_check_in)
 * variants for backward compatibility. This utility provides fallback retry logic
 * when the backend rejects an assignment ID.
 */

import type { CanonicalAssignmentId } from './recordingIds';

/**
 * Map of canonical hyphenated IDs to their underscore variants.
 */
const HYPHEN_TO_UNDERSCORE: Record<CanonicalAssignmentId, string> = {
  'daily-check-in': 'daily_check_in',
  'morning-reflection': 'morning_reflection',
  'evening-reflection': 'evening_reflection',
  'mindfulness-practice': 'mindfulness_practice',
  'gratitude-journal': 'gratitude_journal',
};

/**
 * Map of underscore variants to canonical hyphenated IDs.
 */
const UNDERSCORE_TO_HYPHEN: Record<string, CanonicalAssignmentId> = {
  'daily_check_in': 'daily-check-in',
  'morning_reflection': 'morning-reflection',
  'evening_reflection': 'evening-reflection',
  'mindfulness_practice': 'mindfulness-practice',
  'gratitude_journal': 'gratitude-journal',
};

/**
 * Get the alternate ID format for retry.
 * If the input is hyphenated, returns underscore variant.
 * If the input is underscored, returns hyphenated variant.
 * Returns null if no alternate exists.
 */
export function getAlternateAssignmentId(assignmentId: string): string | null {
  // Try hyphen → underscore
  if (assignmentId in HYPHEN_TO_UNDERSCORE) {
    return HYPHEN_TO_UNDERSCORE[assignmentId as CanonicalAssignmentId];
  }
  
  // Try underscore → hyphen
  if (assignmentId in UNDERSCORE_TO_HYPHEN) {
    return UNDERSCORE_TO_HYPHEN[assignmentId];
  }
  
  return null;
}

/**
 * Normalize any variant to the canonical hyphenated ID.
 * Returns the input unchanged if it's already canonical or if no mapping exists.
 */
export function normalizeToCanonical(assignmentId: string): string {
  if (assignmentId in UNDERSCORE_TO_HYPHEN) {
    return UNDERSCORE_TO_HYPHEN[assignmentId];
  }
  return assignmentId;
}

/**
 * Check if an error is an "Invalid assignment" error from the backend.
 */
export function isInvalidAssignmentError(error: unknown): boolean {
  if (!error) return false;
  
  const errorStr = String(error).toLowerCase();
  return errorStr.includes('invalid assignment');
}

/**
 * Extract the assignment ID from an "Invalid assignment" error message.
 * Returns null if the error doesn't match the expected format.
 */
export function extractAssignmentFromError(error: unknown): string | null {
  if (!error) return null;
  
  const errorStr = String(error);
  const match = errorStr.match(/invalid assignment:\s*["']?([^"'\s]+)["']?/i);
  return match ? match[1] : null;
}
