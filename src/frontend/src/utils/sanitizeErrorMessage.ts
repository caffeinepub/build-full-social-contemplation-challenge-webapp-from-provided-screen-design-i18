/**
 * Shared utility to sanitize error messages and block the bogus "Migrating..." message.
 * Also maps common backend trap messages to user-friendly UI messages.
 */

const BLOCKED_ERROR_MESSAGE = 'Migrating your project to the new structure. Hold tight — this is a one-time operation.';
const GENERIC_ERROR_MESSAGE = 'An error occurred. Please try again.';

/**
 * Sanitize error messages to prevent the bogus migration message from appearing in the UI.
 * Returns a user-friendly error message.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    
    // Block migration message
    if (message.includes(BLOCKED_ERROR_MESSAGE) || message === BLOCKED_ERROR_MESSAGE) {
      return GENERIC_ERROR_MESSAGE;
    }
    
    // Map common backend errors to user-friendly messages
    if (message.includes('Recording already exists')) {
      return 'You already have a recording for this assignment. Delete it first to record again.';
    }
    
    if (message.includes('cannot overwrite')) {
      return 'Cannot overwrite existing recording. Delete it first.';
    }
    
    if (message.includes('not found') || message.includes('No recordings')) {
      return 'Recording not found.';
    }
    
    return message;
  }
  
  if (typeof error === 'string') {
    if (error.includes(BLOCKED_ERROR_MESSAGE) || error === BLOCKED_ERROR_MESSAGE) {
      return GENERIC_ERROR_MESSAGE;
    }
    
    // Map common backend errors
    if (error.includes('Recording already exists')) {
      return 'You already have a recording for this assignment. Delete it first to record again.';
    }
    
    if (error.includes('cannot overwrite')) {
      return 'Cannot overwrite existing recording. Delete it first.';
    }
    
    return error;
  }
  
  // Handle nested error objects
  if (error && typeof error === 'object') {
    const errorObj = error as any;
    if (errorObj.message && typeof errorObj.message === 'string') {
      if (errorObj.message.includes(BLOCKED_ERROR_MESSAGE) || errorObj.message === BLOCKED_ERROR_MESSAGE) {
        return GENERIC_ERROR_MESSAGE;
      }
      
      // Map common backend errors
      if (errorObj.message.includes('Recording already exists')) {
        return 'You already have a recording for this assignment. Delete it first to record again.';
      }
      
      if (errorObj.message.includes('cannot overwrite')) {
        return 'Cannot overwrite existing recording. Delete it first.';
      }
      
      return errorObj.message;
    }
  }
  
  return 'An unexpected error occurred';
}
