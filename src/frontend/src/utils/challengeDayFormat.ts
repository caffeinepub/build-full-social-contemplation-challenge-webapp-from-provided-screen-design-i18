/**
 * Utility to format challenge day headers with weekday and calendar date.
 * Computes dates based on challenge startTime (backend Time bigint) and day index (1-7).
 */

/**
 * Format a day header with day number, weekday, and calendar date.
 * @param startTime - Challenge start time as bigint (nanoseconds since epoch)
 * @param dayIndex - Day number (1-7)
 * @returns Formatted string like "Day 1 — Monday, Feb 4"
 */
export function formatDayHeader(startTime: bigint | null | undefined, dayIndex: number): string {
  // Fallback when startTime is unavailable
  if (!startTime) {
    return `Day ${dayIndex}`;
  }

  try {
    // Convert nanoseconds to milliseconds
    const startMs = Number(startTime / BigInt(1_000_000));
    
    // Calculate the date for this day (dayIndex is 1-based, so subtract 1)
    const dayDate = new Date(startMs + (dayIndex - 1) * 24 * 60 * 60 * 1000);
    
    // Format weekday (e.g., "Monday")
    const weekday = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Format date (e.g., "Feb 4")
    const date = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return `Day ${dayIndex} — ${weekday}, ${date}`;
  } catch (error) {
    console.error('Failed to format day header:', error);
    return `Day ${dayIndex}`;
  }
}
