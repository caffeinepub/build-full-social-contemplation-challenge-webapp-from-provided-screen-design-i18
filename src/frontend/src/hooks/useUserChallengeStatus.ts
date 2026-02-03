import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useAuthPrincipal } from './useAuthPrincipal';
import type { UserChallengeStatus } from '../backend';

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
    staleTime: 30000 // 30 seconds
  });
}
