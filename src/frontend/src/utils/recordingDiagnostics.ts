/**
 * Production-safe diagnostic logging for audio upload operations.
 * Logs minimal context to help debug upload failures without exposing sensitive data.
 */

import { getRunningAppVersion } from './appVersion';
import { getBackendBuildIdentifier } from './backendBuildInfo';

interface UploadAttemptContext {
  challengeId: string;
  uiDay: number;
  backendDay: number;
  assignment: string;
}

interface UploadFailureContext extends UploadAttemptContext {
  error: string;
}

/**
 * Log an upload attempt with context.
 * Safe to keep in production - logs only non-sensitive operation metadata.
 */
export function logUploadAttempt(context: UploadAttemptContext): void {
  console.log('[Recording Upload] Attempt:', {
    challengeId: context.challengeId,
    uiDay: context.uiDay,
    backendDay: context.backendDay,
    assignment: context.assignment,
  });
}

/**
 * Log an upload failure with sanitized error message, context, app version, and backend build ID.
 * Safe to keep in production - error message should already be sanitized by caller.
 */
export function logUploadFailure(context: UploadFailureContext): void {
  const appVersion = getRunningAppVersion();
  const backendBuildId = getBackendBuildIdentifier();
  
  console.error('[Recording Upload] Failed:', {
    challengeId: context.challengeId,
    backendDay: context.backendDay,
    assignment: context.assignment,
    error: context.error,
    appVersion: appVersion || 'unknown',
    backendBuildId,
  });
}

/**
 * Log successful upload completion.
 */
export function logUploadSuccess(context: UploadAttemptContext): void {
  console.log('[Recording Upload] Success:', {
    challengeId: context.challengeId,
    backendDay: context.backendDay,
    assignment: context.assignment,
  });
}
