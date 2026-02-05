/**
 * Shared frontend-only normalizers for recording identifiers.
 * Ensures consistent day and assignment identifiers across all recording operations.
 * 
 * CRITICAL: Assignment IDs must exactly match backend's validAssignments array.
 * Backend canonicalizes by calling .trim().toLower() on all assignment strings.
 */

import { uiDayToBackendDay } from './recordingDayIndex';

/**
 * Canonical assignment IDs used by the backend.
 * These MUST match the validAssignments array in backend/main.mo exactly.
 * 
 * Backend validAssignments (canonical IDs only):
 * ["daily-check-in", "morning-reflection", "evening-reflection", "mindfulness-practice", "gratitude-journal"]
 * 
 * Backend canonicalizes all assignments with .trim().toLower()
 * 
 * IMPORTANT: Only these hyphenated IDs should be used in the frontend.
 * Legacy underscore variants (daily_check_in, morning_reflection, etc.)
 * are accepted by the backend for backward compatibility but should NOT be used
 * in new code.
 */
export const CANONICAL_ASSIGNMENT_IDS = [
  'daily-check-in',
  'morning-reflection',
  'evening-reflection',
  'mindfulness-practice',
  'gratitude-journal',
] as const;

export type CanonicalAssignmentId = typeof CANONICAL_ASSIGNMENT_IDS[number];

/**
 * Normalize a UI day value (1-7) to the backend canonical range (0-6).
 * Uses the existing day conversion utility.
 */
export function normalizeRecordingDay(uiDay: number): number {
  return uiDayToBackendDay(uiDay);
}

/**
 * Normalize any assignment ID variant to the canonical hyphenated form.
 * This is used for React Query cache key normalization to prevent duplicate entries.
 */
export function normalizeToCanonical(assignment: string): string {
  const normalized = assignment.trim().toLowerCase();
  
  // Map underscore variants to canonical hyphenated IDs
  const underscoreToHyphen: Record<string, CanonicalAssignmentId> = {
    'daily_check_in': 'daily-check-in',
    'morning_reflection': 'morning-reflection',
    'evening_reflection': 'evening-reflection',
    'mindfulness_practice': 'mindfulness-practice',
    'gratitude_journal': 'gratitude-journal',
  };
  
  return underscoreToHyphen[normalized] || normalized;
}

/**
 * Validate that a value is a canonical assignment ID.
 * Use this to ensure only valid IDs are passed to recording operations.
 * 
 * @param assignment - The value to check
 * @returns True if the value is a canonical assignment ID
 */
export function isCanonicalAssignmentId(assignment: string): assignment is CanonicalAssignmentId {
  return CANONICAL_ASSIGNMENT_IDS.includes(assignment as CanonicalAssignmentId);
}

/**
 * Assert that a value is a canonical assignment ID.
 * Throws an error if the value is not canonical.
 * 
 * Development-time safety check to catch bugs before they reach the backend.
 * 
 * @param assignment - The value to check
 * @param context - Optional context string for better error messages (e.g., "saveRecording", "deleteRecording")
 * @returns The value as a CanonicalAssignmentId
 * @throws Error if the value is not a canonical assignment ID
 */
export function assertCanonicalAssignmentId(assignment: string, context?: string): CanonicalAssignmentId {
  if (!isCanonicalAssignmentId(assignment)) {
    const contextStr = context ? ` (${context})` : '';
    throw new Error(
      `Invalid assignment ID${contextStr}: "${assignment}". Must be one of: ${CANONICAL_ASSIGNMENT_IDS.join(', ')}. Please refresh the page and try again.`
    );
  }
  return assignment;
}

/**
 * Get all canonical assignment IDs.
 * Use this to ensure UI components use only valid IDs.
 */
export function getCanonicalAssignmentIds(): readonly CanonicalAssignmentId[] {
  return CANONICAL_ASSIGNMENT_IDS;
}
