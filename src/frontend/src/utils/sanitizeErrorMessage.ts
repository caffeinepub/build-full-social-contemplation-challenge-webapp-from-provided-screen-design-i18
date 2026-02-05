/**
 * Client-side error sanitization utility.
 * Maps backend errors to user-friendly messages without exposing sensitive data.
 */

/**
 * Extract error message from various error types.
 */
function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (error && typeof error === 'object') {
    // Handle backend errors with message property
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    
    // Handle errors with error property
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }
  }
  
  return 'An unexpected error occurred';
}

/**
 * Check if an error indicates a challenge was not found or deleted.
 */
export function isChallengeNotFoundError(error: unknown): boolean {
  const message = extractErrorMessage(error).toLowerCase();
  return message.includes('challenge not found');
}

/**
 * Check if an error is an invalid assignment error (stale frontend assets).
 */
export function isInvalidAssignmentError(error: unknown): boolean {
  const message = extractErrorMessage(error).toLowerCase();
  return message.includes('invalid assignment');
}

/**
 * Check if an error indicates a stale build or interface mismatch.
 * Includes invalid assignment errors and common call/decoding failures.
 */
export function isStaleBuildError(error: unknown): boolean {
  const message = extractErrorMessage(error).toLowerCase();
  
  // Invalid assignment is the primary indicator
  if (message.includes('invalid assignment')) {
    return true;
  }
  
  // Common patterns for actor/interface mismatch
  if (message.includes('call failed') || 
      message.includes('decode error') ||
      message.includes('validation failed') ||
      message.includes('interface mismatch')) {
    return true;
  }
  
  return false;
}

/**
 * Check if an error is related to invalid recording parameters.
 */
export function isRecordingParameterError(error: unknown): boolean {
  const message = extractErrorMessage(error).toLowerCase();
  return message.includes('invalid assignment') || message.includes('invalid day');
}

/**
 * Sanitize error messages for display to users.
 * Maps backend errors to user-friendly messages.
 * 
 * IMPORTANT: Only show the "invalid assignment" refresh prompt when the backend
 * explicitly rejects an assignment ID. Do not show it for other errors.
 */
export function sanitizeErrorMessage(error: unknown): string {
  const rawMessage = extractErrorMessage(error);
  const lowerMessage = rawMessage.toLowerCase();
  
  // Access control / permission errors (including CORS-like errors from failed bootstrap)
  if (lowerMessage.includes('access control checks') || 
      lowerMessage.includes('fetch api cannot load') ||
      lowerMessage.includes('due to access control')) {
    return 'You do not have permission to perform this action.';
  }
  
  // Challenge-related errors
  if (lowerMessage.includes('challenge not found')) {
    return 'Challenge not found. It may have been deleted.';
  }
  
  if (lowerMessage.includes('not a participant')) {
    return 'You are not a participant of this challenge.';
  }
  
  if (lowerMessage.includes('already has an active challenge')) {
    return 'You already have an active challenge.';
  }
  
  // Recording-related errors - invalid assignment (stale frontend)
  // Only show refresh prompt if the backend explicitly rejected the assignment
  if (lowerMessage.includes('invalid assignment') && 
      (rawMessage.includes('Please refresh') || rawMessage.includes('refresh the page'))) {
    // Extract the invalid assignment name if present
    const match = rawMessage.match(/invalid assignment[:\s]+["']?([a-z_-]+)["']?/i);
    if (match) {
      return `Invalid assignment: "${match[1]}". Your app may be out of date. Please refresh.`;
    }
    return 'Invalid assignment. Your app may be out of date. Please refresh.';
  }
  
  if (lowerMessage.includes('invalid day')) {
    return 'Invalid day selected. Please select a day between 1 and 7.';
  }
  
  if (lowerMessage.includes('recording already exists')) {
    return 'A recording already exists for this assignment. Delete it before uploading a new one.';
  }
  
  if (lowerMessage.includes('no recordings found')) {
    return 'No recording found for this assignment.';
  }
  
  if (lowerMessage.includes('recording not found')) {
    return 'Recording not found.';
  }
  
  // Profile-related errors
  if (lowerMessage.includes('profile name cannot be empty')) {
    return 'Profile name cannot be empty.';
  }
  
  if (lowerMessage.includes('profile name cannot exceed')) {
    return 'Profile name is too long. Please use a shorter name.';
  }
  
  if (lowerMessage.includes('profile required')) {
    return 'You must complete your profile before performing this action.';
  }
  
  // Invitation-related errors
  if (lowerMessage.includes('invalid invitation code')) {
    return 'Invalid invitation code.';
  }
  
  if (lowerMessage.includes('invitation code has already been used')) {
    return 'This invitation code has already been used.';
  }
  
  if (lowerMessage.includes('invitation codes can only be generated before')) {
    return 'Invitation codes can only be generated before the end of Day 1.';
  }
  
  if (lowerMessage.includes('invitation codes cannot be redeemed after')) {
    return 'Invitation codes cannot be redeemed after Day 1.';
  }
  
  // Permission errors
  if (lowerMessage.includes('only the creator can')) {
    return 'Only the challenge creator can perform this action.';
  }
  
  if (lowerMessage.includes('only participants can')) {
    return 'Only challenge participants can perform this action.';
  }
  
  if (lowerMessage.includes('unauthorized')) {
    return 'You do not have permission to perform this action.';
  }
  
  // Chat-related errors
  if (lowerMessage.includes('message cannot be empty')) {
    return 'Message cannot be empty.';
  }
  
  if (lowerMessage.includes('message cannot exceed')) {
    return 'Message is too long. Please use a shorter message.';
  }
  
  if (lowerMessage.includes('only the author can edit')) {
    return 'You can only edit your own messages.';
  }
  
  // Start time errors
  if (lowerMessage.includes('start time can only be updated before')) {
    return 'Start time can only be updated before the end of Day 1.';
  }
  
  // Generic fallback
  if (lowerMessage.includes('actor not available')) {
    return 'Connection to backend is not available. Please refresh the page.';
  }
  
  // If no specific mapping found, return a generic message
  // Do not expose raw backend errors to users
  return 'An error occurred. Please try again.';
}
