/**
 * Utility to normalize day index for recording operations.
 * 
 * The UI displays days 1–7, but the backend expects days 0–6.
 * This utility converts UI day values to backend day values consistently.
 * 
 * The backend's normalizeDay function handles both formats:
 * - If day is 0, it stays 0
 * - If day is 1, it stays 1  
 * - If day is 2-7, it converts to 1-6 (day - 1)
 * 
 * So we can safely pass UI days (1-7) directly to the backend,
 * but for consistency and clarity, we normalize here on the frontend.
 */

/**
 * Convert UI day (1-7) to backend day (0-6).
 * 
 * @param uiDay - Day number from UI (1-7)
 * @returns Backend day number (0-6)
 */
export function uiDayToBackendDay(uiDay: number): number {
  // Clamp to valid UI range first
  const clamped = Math.max(1, Math.min(7, uiDay));
  
  // Convert to backend range (0-6)
  return clamped - 1;
}

/**
 * Convert backend day (0-6) to UI day (1-7).
 * 
 * @param backendDay - Day number from backend (0-6)
 * @returns UI day number (1-7)
 */
export function backendDayToUiDay(backendDay: number): number {
  // Clamp to valid backend range first
  const clamped = Math.max(0, Math.min(6, backendDay));
  
  // Convert to UI range (1-7)
  return clamped + 1;
}
