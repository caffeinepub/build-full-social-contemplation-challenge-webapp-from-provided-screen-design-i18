/**
 * Shared frontend-only normalizers for recording identifiers.
 * Ensures consistent day and assignment identifiers across all recording operations.
 */

import { uiDayToBackendDay } from './recordingDayIndex';

/**
 * Canonical assignment IDs used by the backend.
 * These must match the validAssignments array in backend/main.mo.
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
 * Legacy assignment ID mapping for backwards compatibility.
 */
const LEGACY_ASSIGNMENT_MAPPING: Record<string, CanonicalAssignmentId> = {
  'assignment1': 'awareness',
  'assignment2': 'utopia',
  'assignment3': 'small-steps',
  'assignment4': 'support-strategies',
  'assignment5': 'other-contemplations',
};

/**
 * Normalize a UI day value (1-7) to the backend canonical range (0-6).
 * Uses the existing day conversion utility.
 */
export function normalizeRecordingDay(uiDay: number): number {
  return uiDayToBackendDay(uiDay);
}

/**
 * Normalize an assignment identifier to the canonical ID used by the backend.
 * Handles both canonical IDs and legacy IDs.
 * 
 * @param assignment - The assignment identifier to normalize
 * @returns The canonical assignment ID
 * @throws Error if the assignment ID is invalid
 */
export function normalizeAssignmentId(assignment: string): CanonicalAssignmentId {
  // Check if it's already a canonical ID
  if (CANONICAL_ASSIGNMENT_IDS.includes(assignment as CanonicalAssignmentId)) {
    return assignment as CanonicalAssignmentId;
  }
  
  // Check if it's a legacy ID
  const canonical = LEGACY_ASSIGNMENT_MAPPING[assignment];
  if (canonical) {
    return canonical;
  }
  
  // Invalid assignment ID
  throw new Error(`Invalid assignment ID: ${assignment}. Expected one of: ${CANONICAL_ASSIGNMENT_IDS.join(', ')}`);
}

/**
 * Validate that an assignment ID is canonical.
 * Returns true if the ID is in the canonical list.
 */
export function isCanonicalAssignmentId(assignment: string): assignment is CanonicalAssignmentId {
  return CANONICAL_ASSIGNMENT_IDS.includes(assignment as CanonicalAssignmentId);
}
