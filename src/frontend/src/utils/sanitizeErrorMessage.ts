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
  const message = extractErrorMessage(error);
  
  if (!message) {
    return 'An unexpected error occurred';
  }
  
  // Block migration message
  if (message.includes(BLOCKED_ERROR_MESSAGE) || message === BLOCKED_ERROR_MESSAGE) {
    return GENERIC_ERROR_MESSAGE;
  }
  
  // Map common backend errors to user-friendly messages
  if (message.includes('Recording already exists')) {
    return 'You already have a recording for this assignment. Delete it first to upload another.';
  }
  
  if (message.includes('cannot overwrite')) {
    return 'Cannot overwrite existing recording. Delete it first to upload another.';
  }
  
  if (message.includes('Challenge not found')) {
    return 'Challenge not found. It may have been deleted.';
  }
  
  if (message.includes('not found') || message.includes('No recordings')) {
    return 'Recording not found.';
  }
  
  // Chat-related errors
  if (message.includes('Message cannot be empty') || message.includes('whitespace only')) {
    return 'Message cannot be empty or contain only spaces.';
  }
  
  if (message.includes('Only participants can post messages') || message.includes('Only participants can fetch messages')) {
    return 'Only challenge participants can use the chat.';
  }

  if (message.includes('Only the author can edit this message') || message.includes('Unauthorized: Only the author')) {
    return 'You can only edit your own messages.';
  }

  if (message.includes('Message not found')) {
    return 'Message not found. It may have been deleted.';
  }

  // Profile-related errors
  if (message.includes('Profile name cannot be empty') || message.includes('Profile required')) {
    return message; // Keep original message for profile errors
  }

  // Invitation-related errors
  if (message.includes('Invalid invitation code') || message.includes('already been used')) {
    return message; // Keep original message for invitation errors
  }
  
  return message;
}

/**
 * Extract error message from various error types
 */
function extractErrorMessage(error: unknown): string | null {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object') {
    const errorObj = error as any;
    if (errorObj.message && typeof errorObj.message === 'string') {
      return errorObj.message;
    }
  }
  
  return null;
}

/**
 * Check if an error is a "Challenge not found" error.
 */
export function isChallengeNotFoundError(error: unknown): boolean {
  const message = extractErrorMessage(error);
  return message ? message.includes('Challenge not found') : false;
}
