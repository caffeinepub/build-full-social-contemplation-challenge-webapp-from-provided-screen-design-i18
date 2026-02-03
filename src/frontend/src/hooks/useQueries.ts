import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useAuthPrincipal } from './useAuthPrincipal';
import type { UserProfile, UserChallengeStatus, ExternalBlob } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';
import { persistActiveChallengeId, clearPersistedActiveChallengeId } from '../utils/challengeContext';

// ============================================================================
// User Profile Queries
// ============================================================================

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { isAuthenticated } = useAuthPrincipal();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
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
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ============================================================================
// Challenge Status Query
// ============================================================================

export function useUserChallengeStatus() {
  const { actor, isFetching: actorFetching } = useActor();
  const { isAuthenticated } = useAuthPrincipal();

  return useQuery<UserChallengeStatus>({
    queryKey: ['userChallengeStatus'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUserChallengeStatus();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: 2,
    staleTime: 30000, // 30 seconds
  });
}

// ============================================================================
// Challenge Mutations
// ============================================================================

export function useCreateChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (startTime: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createChallenge(startTime);
    },
    onSuccess: (challengeId) => {
      // Persist the created challenge ID
      persistActiveChallengeId(challengeId);
      queryClient.invalidateQueries({ queryKey: ['userChallengeStatus'] });
      queryClient.invalidateQueries({ queryKey: ['challengeDetails'] });
      queryClient.invalidateQueries({ queryKey: ['activeChallengeId'] });
    },
  });
}

export function useGetActiveChallengeIdForCreator() {
  const { actor, isFetching: actorFetching } = useActor();
  const { isAuthenticated } = useAuthPrincipal();

  return useQuery<bigint | null>({
    queryKey: ['activeChallengeId'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getActiveChallengeIdForCreator();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    staleTime: 10000, // 10 seconds
  });
}

export function useGenerateInvitationCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ challengeId, code }: { challengeId: bigint; code: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!challengeId) throw new Error('Challenge ID is required');
      return actor.generateInvitationCode(challengeId, code);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['invitationCodes', variables.challengeId.toString()] 
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
      if (!challengeId) throw new Error('Challenge ID is required');
      if (!code) throw new Error('Invitation code is required');
      return actor.redeemInvitationCode(challengeId, code);
    },
    onSuccess: (_, variables) => {
      // Persist the joined challenge ID
      persistActiveChallengeId(variables.challengeId);
      queryClient.invalidateQueries({ queryKey: ['userChallengeStatus'] });
      queryClient.invalidateQueries({ queryKey: ['challengeDetails'] });
      queryClient.invalidateQueries({ queryKey: ['challengeParticipants'] });
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
        queryKey: ['challengeDetails', variables.challengeId.toString()] 
      });
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
      // Clear persisted challenge ID on leave
      clearPersistedActiveChallengeId();
      queryClient.invalidateQueries({ queryKey: ['userChallengeStatus'] });
      queryClient.invalidateQueries({ queryKey: ['challengeDetails'] });
      queryClient.invalidateQueries({ queryKey: ['challengeParticipants'] });
      queryClient.invalidateQueries({ queryKey: ['activeChallengeId'] });
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
      // Clear persisted challenge ID on delete
      clearPersistedActiveChallengeId();
      queryClient.invalidateQueries({ queryKey: ['userChallengeStatus'] });
      queryClient.invalidateQueries({ queryKey: ['challengeDetails'] });
      queryClient.invalidateQueries({ queryKey: ['challengeParticipants'] });
      queryClient.invalidateQueries({ queryKey: ['activeChallengeId'] });
    },
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
        queryKey: ['challengeParticipants', variables.challengeId.toString()] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['participantProfiles', variables.challengeId.toString()] 
      });
    },
  });
}

// ============================================================================
// Challenge Detail Queries
// ============================================================================

export function useGetChallengeParticipants(challengeId: bigint | null | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  const { isAuthenticated } = useAuthPrincipal();

  // Strict validation: only enable if challengeId is a valid bigint
  const isValidChallengeId = challengeId !== null && challengeId !== undefined && typeof challengeId === 'bigint';

  return useQuery<Principal[]>({
    queryKey: ['challengeParticipants', isValidChallengeId ? challengeId.toString() : 'none'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isValidChallengeId) throw new Error('Invalid challenge ID');
      return actor.getChallengeParticipants(challengeId);
    },
    enabled: !!actor && !actorFetching && isAuthenticated && isValidChallengeId,
    staleTime: 10000, // 10 seconds
  });
}

export function useGetAvailableInvitationCodes(challengeId: bigint | null | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  const { isAuthenticated } = useAuthPrincipal();

  // Strict validation: only enable if challengeId is a valid bigint
  const isValidChallengeId = challengeId !== null && challengeId !== undefined && typeof challengeId === 'bigint';

  return useQuery<string[]>({
    queryKey: ['invitationCodes', isValidChallengeId ? challengeId.toString() : 'none'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isValidChallengeId) throw new Error('Invalid challenge ID');
      return actor.getAvailableInvitationCodes(challengeId);
    },
    enabled: !!actor && !actorFetching && isAuthenticated && isValidChallengeId,
    staleTime: 5000, // 5 seconds
    refetchInterval: 10000, // Refetch every 10 seconds to catch redeemed codes
  });
}

// ============================================================================
// Helper to fetch participant profiles
// ============================================================================

export function useGetParticipantProfiles(participants: Principal[] | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Array<{ principal: string; name: string }>>({
    queryKey: ['participantProfiles', participants?.map(p => p.toString()).join(',')],
    queryFn: async () => {
      if (!actor || !participants) return [];
      
      const profiles = await Promise.all(
        participants.map(async (principal) => {
          try {
            const profile = await actor.getUserProfile(principal);
            return {
              principal: principal.toString(),
              name: profile?.name || 'Unknown User',
            };
          } catch {
            return {
              principal: principal.toString(),
              name: 'Unknown User',
            };
          }
        })
      );
      
      return profiles;
    },
    enabled: !!actor && !actorFetching && !!participants && participants.length > 0,
    staleTime: 30000, // 30 seconds
  });
}

export function useGetAllChallengeParticipantProfiles(challengeId: bigint | null | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  const { isAuthenticated } = useAuthPrincipal();

  const isValidChallengeId = challengeId !== null && challengeId !== undefined && typeof challengeId === 'bigint';

  return useQuery<Array<[Principal, UserProfile | null]>>({
    queryKey: ['allParticipantProfiles', isValidChallengeId ? challengeId.toString() : 'none'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isValidChallengeId) throw new Error('Invalid challenge ID');
      return actor.getAllChallengeParticipantProfiles(challengeId);
    },
    enabled: !!actor && !actorFetching && isAuthenticated && isValidChallengeId,
    staleTime: 30000, // 30 seconds
  });
}

// ============================================================================
// Per-Assignment Recording Queries and Mutations
// ============================================================================

/**
 * Save a recording for a specific day and assignment.
 */
export function useSaveRecording() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      challengeId, 
      day, 
      assignment, 
      recording 
    }: { 
      challengeId: bigint; 
      day: number; 
      assignment: string; 
      recording: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveRecording(challengeId, BigInt(day), assignment, recording);
    },
    onSuccess: (_, variables) => {
      // Invalidate queries for this specific recording
      queryClient.invalidateQueries({ 
        queryKey: ['recording', variables.challengeId.toString(), variables.day.toString(), variables.assignment] 
      });
      // Invalidate all recordings for this day/assignment (for Team tab)
      queryClient.invalidateQueries({ 
        queryKey: ['assignmentRecordings', variables.challengeId.toString(), variables.day.toString(), variables.assignment] 
      });
    },
  });
}

/**
 * Get the current user's recording for a specific day and assignment.
 */
export function useGetRecording(
  challengeId: bigint | null | undefined,
  day: number,
  assignment: string
) {
  const { actor, isFetching: actorFetching } = useActor();
  const { isAuthenticated } = useAuthPrincipal();

  const isValidChallengeId = challengeId !== null && challengeId !== undefined && typeof challengeId === 'bigint';

  return useQuery<ExternalBlob | null>({
    queryKey: ['recording', isValidChallengeId ? challengeId.toString() : 'none', day.toString(), assignment],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isValidChallengeId) throw new Error('Invalid challenge ID');
      try {
        return await actor.getRecording(challengeId, BigInt(day), assignment);
      } catch (error: any) {
        // If recording not found, return null instead of throwing
        if (error?.message?.includes('not found') || error?.message?.includes('No recordings')) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !actorFetching && isAuthenticated && isValidChallengeId,
    staleTime: 5000,
    retry: false,
  });
}

/**
 * Delete the current user's recording for a specific day and assignment.
 */
export function useDeleteRecording() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      challengeId, 
      day, 
      assignment 
    }: { 
      challengeId: bigint; 
      day: number; 
      assignment: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteRecording(challengeId, BigInt(day), assignment);
    },
    onSuccess: (_, variables) => {
      // Invalidate queries for this specific recording
      queryClient.invalidateQueries({ 
        queryKey: ['recording', variables.challengeId.toString(), variables.day.toString(), variables.assignment] 
      });
      // Invalidate all recordings for this day/assignment (for Team tab)
      queryClient.invalidateQueries({ 
        queryKey: ['assignmentRecordings', variables.challengeId.toString(), variables.day.toString(), variables.assignment] 
      });
    },
  });
}

/**
 * Get all participants' recordings for a specific day and assignment (for Team tab).
 */
export function useGetAssignmentRecordings(
  challengeId: bigint | null | undefined,
  day: number,
  assignment: string
) {
  const { actor, isFetching: actorFetching } = useActor();
  const { isAuthenticated } = useAuthPrincipal();

  const isValidChallengeId = challengeId !== null && challengeId !== undefined && typeof challengeId === 'bigint';

  return useQuery<Array<[Principal, ExternalBlob | null]>>({
    queryKey: ['assignmentRecordings', isValidChallengeId ? challengeId.toString() : 'none', day.toString(), assignment],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isValidChallengeId) throw new Error('Invalid challenge ID');
      return actor.getAssignmentRecordings(challengeId, BigInt(day), assignment);
    },
    enabled: !!actor && !actorFetching && isAuthenticated && isValidChallengeId,
    staleTime: 5000,
  });
}

/**
 * Get a specific participant's recording for a specific day and assignment.
 */
export function useGetParticipantRecording(
  challengeId: bigint | null | undefined,
  participant: Principal | null,
  day: number,
  assignment: string
) {
  const { actor, isFetching: actorFetching } = useActor();
  const { isAuthenticated } = useAuthPrincipal();

  const isValidChallengeId = challengeId !== null && challengeId !== undefined && typeof challengeId === 'bigint';
  const isValidParticipant = participant !== null;

  return useQuery<ExternalBlob | null>({
    queryKey: [
      'participantRecording',
      isValidChallengeId ? challengeId.toString() : 'none',
      participant?.toString() || 'none',
      day.toString(),
      assignment
    ],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isValidChallengeId) throw new Error('Invalid challenge ID');
      if (!isValidParticipant) throw new Error('Invalid participant');
      try {
        return await actor.getParticipantRecording(challengeId, participant, BigInt(day), assignment);
      } catch (error: any) {
        // If recording not found, return null instead of throwing
        if (error?.message?.includes('not found') || error?.message?.includes('No recordings')) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !actorFetching && isAuthenticated && isValidChallengeId && isValidParticipant,
    staleTime: 5000,
    retry: false,
  });
}
