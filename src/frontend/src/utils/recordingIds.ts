/**
 * Shared frontend-only normalizers for recording identifiers.
 * Ensures consistent day and assignment identifiers across all recording operations.
 * 
 * CRITICAL: Assignment IDs must exactly match backend's validAssignments array.
 * Backend canonicalizes by calling .toLower() on all assignment strings.
 */

import { uiDayToBackendDay } from './recordingDayIndex';

/**
 * Canonical assignment IDs used by the backend.
 * These MUST match the validAssignments array in backend/main.mo exactly.
 * 
 * Backend validAssignments:
 * ["awareness", "utopia", "small-steps", "support-strategies", "other-contemplations"]
 * 
 * Backend canonicalizes all assignments with .toLower()
 */
export const CANONICAL_ASSIGNMENT_IDS = [
  'awareness',
  'utopia',
  'small-steps',
  'support-strategies',
  'other-contemplations',
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
 * Normalize an assignment identifier to the canonical ID used by the backend.
 * Applies the same canonicalization as the backend: trim and lowercase.
 * 
 * @param assignment - The assignment identifier to normalize
 * @returns The canonical assignment ID
 * @throws Error if the assignment ID is invalid after normalization
 */
export function normalizeAssignmentId(assignment: string): CanonicalAssignmentId {
  // Apply backend's canonicalization: trim and lowercase
  const normalized = assignment.trim().toLowerCase();
  
  // Check if it's a canonical ID after normalization
  if (CANONICAL_ASSIGNMENT_IDS.includes(normalized as CanonicalAssignmentId)) {
    return normalized as CanonicalAssignmentId;
  }
  
  // Invalid assignment ID - provide clear error with valid options
  throw new Error(
    `Invalid assignment ID: "${assignment}" (normalized: "${normalized}"). Must be one of: ${CANONICAL_ASSIGNMENT_IDS.join(', ')}`
  );
}

/**
 * Validate that an assignment ID is canonical after normalization.
 * Returns true if the ID is in the canonical list after trim and lowercase.
 */
export function isCanonicalAssignmentId(assignment: string): assignment is CanonicalAssignmentId {
  const normalized = assignment.trim().toLowerCase();
  return CANONICAL_ASSIGNMENT_IDS.includes(normalized as CanonicalAssignmentId);
}

/**
 * Get all canonical assignment IDs.
 * Use this to ensure UI components use only valid IDs.
 */
export function getCanonicalAssignmentIds(): readonly CanonicalAssignmentId[] {
  return CANONICAL_ASSIGNMENT_IDS;
}
