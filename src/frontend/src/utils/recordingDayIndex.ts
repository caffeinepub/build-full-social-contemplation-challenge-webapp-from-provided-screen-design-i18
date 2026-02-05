/**
 * Utility functions to convert between UI day values (1-7) and backend day values (0-6).
 * 
 * UI displays days as 1-7 (user-friendly)
 * Backend stores days as 0-6 (zero-indexed for 7-day challenge)
 */

/**
 * Convert UI day (1-7) to backend day (0-6).
 * Validates input and throws on invalid values.
 * 
 * @param uiDay - Day value from UI (1-7)
 * @returns Backend day value (0-6)
 * @throws Error if uiDay is outside valid range
 */
export function uiDayToBackendDay(uiDay: number): number {
  if (!Number.isInteger(uiDay)) {
    throw new Error(`UI day must be an integer, got: ${uiDay}`);
  }
  
  if (uiDay < 1 || uiDay > 7) {
    throw new Error(`UI day must be between 1 and 7, got: ${uiDay}`);
  }
  
  return uiDay - 1;
}

/**
 * Convert backend day (0-6) to UI day (1-7).
 * Validates input and throws on invalid values.
 * 
 * @param backendDay - Day value from backend (0-6)
 * @returns UI day value (1-7)
 * @throws Error if backendDay is outside valid range
 */
export function backendDayToUiDay(backendDay: number): number {
  if (!Number.isInteger(backendDay)) {
    throw new Error(`Backend day must be an integer, got: ${backendDay}`);
  }
  
  if (backendDay < 0 || backendDay > 6) {
    throw new Error(`Backend day must be between 0 and 6, got: ${backendDay}`);
  }
  
  return backendDay + 1;
}

/**
 * Validate that a UI day is in the valid range (1-7).
 */
export function isValidUiDay(day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= 7;
}

/**
 * Validate that a backend day is in the valid range (0-6).
 */
export function isValidBackendDay(day: number): boolean {
  return Number.isInteger(day) && day >= 0 && day <= 6;
}
