/**
 * Comprehensive challenge state reset utility.
 * Clears all challenge-related client state when a challenge is deleted or not found.
 */

import { QueryClient } from '@tanstack/react-query';
import { clearPersistedActiveChallengeId } from './challengeContext';
import { clearAppUrlState } from './appUrlState';
import { QUERY_KEYS } from '../hooks/useQueries';

/**
 * Performs a full challenge state reset:
 * - Clears persisted challenge context (sessionStorage)
 * - Clears app URL navigation state
 * - Invalidates all challenge-related React Query caches
 */
export function resetChallengeState(queryClient: QueryClient): void {
  // Clear persisted challenge ID from sessionStorage
  clearPersistedActiveChallengeId();
  
  // Clear URL state (screen, tab, day, participant selections)
  clearAppUrlState();
  
  // Invalidate all challenge-related queries
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userChallengeStatus });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeChallengeIdForCreator });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeChallengeIdForParticipant });
  
  // Remove all challenge-scoped cached data
  queryClient.removeQueries({ queryKey: ['availableInvitationCodes'] });
  queryClient.removeQueries({ queryKey: ['challengeParticipants'] });
  queryClient.removeQueries({ queryKey: ['participantProfiles'] });
  queryClient.removeQueries({ queryKey: ['challengeStartTime'] });
  queryClient.removeQueries({ queryKey: ['recording'] });
  queryClient.removeQueries({ queryKey: ['assignmentRecordings'] });
  queryClient.removeQueries({ queryKey: ['participantRecording'] });
  queryClient.removeQueries({ queryKey: ['chatMessages'] });
  queryClient.removeQueries({ queryKey: ['chatMessage'] });
}
