import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, UserChallengeStatus, ChatMessage } from '../backend';
import { Principal } from '@dfinity/principal';
import type { ExternalBlob } from '../backend';
import { normalizeRecordingDay, assertCanonicalAssignmentId } from '../utils/recordingIds';
import type { CanonicalAssignmentId } from '../utils/recordingIds';
import { logUploadAttempt, logUploadFailure, logUploadSuccess } from '../utils/recordingDiagnostics';
import { sanitizeErrorMessage, isInvalidAssignmentError } from '../utils/sanitizeErrorMessage';
import { getRunningAppVersion } from '../utils/appVersion';

// ============================================================================
// React Query Key Constants (exported for consistent invalidation)
// ============================================================================

export const QUERY_KEYS = {
  currentUserProfile: ['currentUserProfile'],
  userProfile: (principal: string) => ['userProfile', principal],
  userChallengeStatus: ['userChallengeStatus'],
  activeChallengeIdForCreator: ['activeChallengeIdForCreator'],
  activeChallengeIdForParticipant: ['activeChallengeIdForParticipant'],
  availableInvitationCodes: (challengeId: string) => ['availableInvitationCodes', challengeId],
  challengeParticipants: (challengeId: string) => ['challengeParticipants', challengeId],
  participantProfiles: (challengeId: string) => ['participantProfiles', challengeId],
  challengeStartTime: (challengeId: string) => ['challengeStartTime', challengeId],
  recording: (challengeId: string, day: string, assignment: string) => ['recording', challengeId, day, assignment],
  assignmentRecordings: (challengeId: string, day: string, assignment: string) => ['assignmentRecordings', challengeId, day, assignment],
  participantRecording: (challengeId: string, participant: string, day: string, assignment: string) => ['participantRecording', challengeId, participant, day, assignment],
  chatMessages: (challengeId: string) => ['chatMessages', challengeId],
  chatMessage: (challengeId: string, messageId: string) => ['chatMessage', challengeId, messageId],
} as const;

// ============================================================================
// User Profile Queries
// ============================================================================

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: QUERY_KEYS.currentUserProfile,
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(userPrincipal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: QUERY_KEYS.userProfile(userPrincipal?.toString() || ''),
    queryFn: async () => {
      if (!actor || !userPrincipal) throw new Error('Actor or user principal not available');
      return actor.getUserProfile(userPrincipal);
    },
    enabled: !!actor && !actorFetching && !!userPrincipal,
    retry: false,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUserProfile });
      queryClient.invalidateQueries({ queryKey: ['participantProfiles'] });
    },
  });
}

// ============================================================================
// Challenge Status & ID Resolution
// ============================================================================

export function useGetUserChallengeStatus() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserChallengeStatus>({
    queryKey: QUERY_KEYS.userChallengeStatus,
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUserChallengeStatus();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useGetActiveChallengeIdForCreator() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint | null>({
    queryKey: QUERY_KEYS.activeChallengeIdForCreator,
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getActiveChallengeIdForCreator();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useGetActiveChallengeIdForParticipant() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint | null>({
    queryKey: QUERY_KEYS.activeChallengeIdForParticipant,
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getActiveChallengeIdForParticipant();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useGetUnifiedChallengeId() {
  const creatorQuery = useGetActiveChallengeIdForCreator();
  const participantQuery = useGetActiveChallengeIdForParticipant();

  const challengeId = creatorQuery.data ?? participantQuery.data ?? null;
  const isLoading = creatorQuery.isLoading || participantQuery.isLoading;
  const error = creatorQuery.error || participantQuery.error;

  return {
    challengeId,
    isLoading,
    error,
  };
}

// ============================================================================
// Challenge Management
// ============================================================================

export function useCreateChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (startTime: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createChallenge(startTime);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userChallengeStatus });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeChallengeIdForCreator });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeChallengeIdForParticipant });
    },
  });
}

export function useUpdateStartTime() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ challengeId, newStartTime }: { challengeId: bigint; newStartTime: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateStartTime(challengeId, newStartTime);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.challengeStartTime(variables.challengeId.toString()) 
      });
    },
  });
}

export function useDeleteChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (challengeId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteChallenge(challengeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userChallengeStatus });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeChallengeIdForCreator });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeChallengeIdForParticipant });
      queryClient.invalidateQueries({ queryKey: ['availableInvitationCodes'] });
      queryClient.invalidateQueries({ queryKey: ['challengeParticipants'] });
      queryClient.invalidateQueries({ queryKey: ['participantProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['challengeStartTime'] });
    },
  });
}

export function useLeaveChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (challengeId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.leaveChallenge(challengeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userChallengeStatus });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeChallengeIdForCreator });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeChallengeIdForParticipant });
    },
  });
}

// ============================================================================
// Invitation Codes
// ============================================================================

export function useGenerateInvitationCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ challengeId, code }: { challengeId: bigint; code: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.generateInvitationCode(challengeId, code);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.availableInvitationCodes(variables.challengeId.toString()) 
      });
    },
  });
}

export function useRedeemInvitationCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ challengeId, code }: { challengeId: bigint; code: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.redeemInvitationCode(challengeId, code);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userChallengeStatus });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeChallengeIdForCreator });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeChallengeIdForParticipant });
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.challengeParticipants(variables.challengeId.toString()) 
      });
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.participantProfiles(variables.challengeId.toString()) 
      });
    },
  });
}

export function useGetAvailableInvitationCodes(challengeId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string[]>({
    queryKey: QUERY_KEYS.availableInvitationCodes(challengeId?.toString() || ''),
    queryFn: async () => {
      if (!actor || challengeId === null) throw new Error('Actor or challenge ID not available');
      return actor.getAvailableInvitationCodes(challengeId);
    },
    enabled: !!actor && !actorFetching && challengeId !== null,
    retry: false,
  });
}

// ============================================================================
// Participants
// ============================================================================

export function useGetChallengeParticipants(challengeId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: QUERY_KEYS.challengeParticipants(challengeId?.toString() || ''),
    queryFn: async () => {
      if (!actor || challengeId === null) throw new Error('Actor or challenge ID not available');
      return actor.getChallengeParticipants(challengeId);
    },
    enabled: !!actor && !actorFetching && challengeId !== null,
    retry: false,
  });
}

export function useGetAllChallengeParticipantProfiles(challengeId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Array<[Principal, UserProfile | null]>>({
    queryKey: QUERY_KEYS.participantProfiles(challengeId?.toString() || ''),
    queryFn: async () => {
      if (!actor || challengeId === null) throw new Error('Actor or challenge ID not available');
      return actor.getAllChallengeParticipantProfiles(challengeId);
    },
    enabled: !!actor && !actorFetching && challengeId !== null,
    retry: false,
  });
}

export function useRemoveParticipant() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ challengeId, participant }: { challengeId: bigint; participant: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeParticipant(challengeId, participant);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.challengeParticipants(variables.challengeId.toString()) 
      });
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.participantProfiles(variables.challengeId.toString()) 
      });
    },
  });
}

// ============================================================================
// Recordings
// ============================================================================

export function useSaveRecording() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      challengeId,
      day,
      assignment,
      recording,
    }: {
      challengeId: bigint;
      day: number;
      assignment: CanonicalAssignmentId;
      recording: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not available');
      
      // Development-time assertion: ensure assignment is canonical
      assertCanonicalAssignmentId(assignment, 'useSaveRecording');
      
      // Normalize UI day (1-7) to backend day (0-6)
      const backendDay = normalizeRecordingDay(day);
      
      // Log upload attempt with full context
      logUploadAttempt({
        challengeId: challengeId.toString(),
        uiDay: day,
        backendDay,
        assignment,
      });
      
      try {
        // Assignment is already canonical - pass directly without normalization
        const result = await actor.saveRecording(challengeId, BigInt(backendDay), assignment, recording);
        
        // Log success
        logUploadSuccess({
          challengeId: challengeId.toString(),
          uiDay: day,
          backendDay,
          assignment,
        });
        
        return result;
      } catch (error) {
        // Get app version for invalid assignment errors
        const appVersion = getRunningAppVersion();
        
        // Log failure with sanitized error and app version for invalid assignment cases
        const sanitizedError = sanitizeErrorMessage(error);
        logUploadFailure({
          challengeId: challengeId.toString(),
          uiDay: day,
          backendDay,
          assignment,
          error: sanitizedError,
        });
        
        // Additional logging for invalid assignment errors
        if (isInvalidAssignmentError(error)) {
          console.error('[Recording Upload] Invalid assignment error detected:', {
            assignment,
            appVersion: appVersion || 'unknown',
            hint: 'This usually indicates stale frontend assets. User should refresh.',
          });
        }
        
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      const backendDay = normalizeRecordingDay(variables.day);
      
      // Remove the cached recording query data immediately
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.recording(variables.challengeId.toString(), backendDay.toString(), variables.assignment),
      });
      
      // Then invalidate to trigger refetch
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.recording(variables.challengeId.toString(), backendDay.toString(), variables.assignment),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.assignmentRecordings(variables.challengeId.toString(), backendDay.toString(), variables.assignment),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.participantRecording(variables.challengeId.toString(), '', backendDay.toString(), variables.assignment),
      });
    },
  });
}

export function useGetRecording(challengeId: bigint | null, day: number, assignment: CanonicalAssignmentId) {
  const { actor, isFetching: actorFetching } = useActor();

  // Development-time assertion: ensure assignment is canonical
  assertCanonicalAssignmentId(assignment, 'useGetRecording');

  // Normalize UI day (1-7) to backend day (0-6)
  const backendDay = normalizeRecordingDay(day);

  return useQuery<ExternalBlob>({
    queryKey: QUERY_KEYS.recording(challengeId?.toString() || '', backendDay.toString(), assignment),
    queryFn: async () => {
      if (!actor || challengeId === null) throw new Error('Actor or challenge ID not available');
      return actor.getRecording(challengeId, BigInt(backendDay), assignment);
    },
    enabled: !!actor && !actorFetching && challengeId !== null,
    retry: false,
  });
}

export function useDeleteRecording() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ challengeId, day, assignment }: { challengeId: bigint; day: number; assignment: CanonicalAssignmentId }) => {
      if (!actor) throw new Error('Actor not available');
      
      // Development-time assertion: ensure assignment is canonical
      assertCanonicalAssignmentId(assignment, 'useDeleteRecording');
      
      // Normalize UI day (1-7) to backend day (0-6)
      const backendDay = BigInt(normalizeRecordingDay(day));
      
      // Assignment is already canonical - pass directly without normalization
      return actor.deleteRecording(challengeId, backendDay, assignment);
    },
    onSuccess: (_, variables) => {
      const backendDay = normalizeRecordingDay(variables.day);
      
      // Remove the cached recording query data immediately
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.recording(variables.challengeId.toString(), backendDay.toString(), variables.assignment),
      });
      
      // Then invalidate to trigger refetch
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.recording(variables.challengeId.toString(), backendDay.toString(), variables.assignment),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.assignmentRecordings(variables.challengeId.toString(), backendDay.toString(), variables.assignment),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.participantRecording(variables.challengeId.toString(), '', backendDay.toString(), variables.assignment),
      });
    },
  });
}

export function useGetAssignmentRecordings(challengeId: bigint | null, day: number, assignment: CanonicalAssignmentId) {
  const { actor, isFetching: actorFetching } = useActor();

  // Development-time assertion: ensure assignment is canonical
  assertCanonicalAssignmentId(assignment, 'useGetAssignmentRecordings');

  // Normalize UI day (1-7) to backend day (0-6)
  const backendDay = normalizeRecordingDay(day);

  return useQuery<Array<[Principal, ExternalBlob | null]>>({
    queryKey: QUERY_KEYS.assignmentRecordings(challengeId?.toString() || '', backendDay.toString(), assignment),
    queryFn: async () => {
      if (!actor || challengeId === null) throw new Error('Actor or challenge ID not available');
      return actor.getAssignmentRecordings(challengeId, BigInt(backendDay), assignment);
    },
    enabled: !!actor && !actorFetching && challengeId !== null,
    retry: false,
  });
}

export function useGetParticipantRecording(
  challengeId: bigint | null,
  participant: Principal | null,
  day: number,
  assignment: CanonicalAssignmentId
) {
  const { actor, isFetching: actorFetching } = useActor();

  // Development-time assertion: ensure assignment is canonical
  assertCanonicalAssignmentId(assignment, 'useGetParticipantRecording');

  // Normalize UI day (1-7) to backend day (0-6)
  const backendDay = normalizeRecordingDay(day);

  return useQuery<ExternalBlob>({
    queryKey: QUERY_KEYS.participantRecording(challengeId?.toString() || '', participant?.toString() || '', backendDay.toString(), assignment),
    queryFn: async () => {
      if (!actor || challengeId === null || participant === null)
        throw new Error('Actor, challenge ID, or participant not available');
      return actor.getParticipantRecording(challengeId, participant, BigInt(backendDay), assignment);
    },
    enabled: !!actor && !actorFetching && challengeId !== null && participant !== null,
    retry: false,
  });
}

// ============================================================================
// Challenge Start Time
// ============================================================================

export function useGetChallengeStartTime(challengeId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: QUERY_KEYS.challengeStartTime(challengeId?.toString() || ''),
    queryFn: async () => {
      if (!actor || challengeId === null) throw new Error('Actor or challenge ID not available');
      return actor.getChallengeStartTime(challengeId);
    },
    enabled: !!actor && !actorFetching && challengeId !== null,
    retry: false,
  });
}

// ============================================================================
// Chat Messages
// ============================================================================

export function usePostMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ challengeId, text, replyTo }: { challengeId: bigint; text: string; replyTo?: bigint | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.postMessage(challengeId, text, replyTo ?? null);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.chatMessages(variables.challengeId.toString()),
      });
    },
  });
}

export function useEditMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ challengeId, messageId, newText }: { challengeId: bigint; messageId: bigint; newText: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editMessage(challengeId, messageId, newText);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.chatMessages(variables.challengeId.toString()),
      });
    },
  });
}

export function useGetMessages(challengeId: bigint | null, isActive: boolean = true) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ChatMessage[]>({
    queryKey: QUERY_KEYS.chatMessages(challengeId?.toString() || ''),
    queryFn: async () => {
      if (!actor || challengeId === null) throw new Error('Actor or challenge ID not available');
      return actor.getMessages(challengeId);
    },
    enabled: !!actor && !actorFetching && challengeId !== null,
    refetchInterval: isActive ? 5000 : false,
    retry: false,
  });
}

export function useGetMessage(challengeId: bigint | null, messageId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ChatMessage>({
    queryKey: QUERY_KEYS.chatMessage(challengeId?.toString() || '', messageId?.toString() || ''),
    queryFn: async () => {
      if (!actor || challengeId === null || messageId === null) throw new Error('Actor, challenge ID, or message ID not available');
      return actor.getMessage(challengeId, messageId);
    },
    enabled: !!actor && !actorFetching && challengeId !== null && messageId !== null,
    retry: false,
  });
}
