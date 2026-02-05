import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { useRedeemInvitationCode, QUERY_KEYS } from '../hooks/useQueries';
import { getPersistedInvitationParams, clearPersistedInvitationParams, clearInvitationFromURL } from '../utils/invitationLinks';
import { sanitizeErrorMessage } from '../utils/sanitizeErrorMessage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface AutoInvitationRedeemGateProps {
  children: React.ReactNode;
  hasActiveChallenge: boolean;
}

export function AutoInvitationRedeemGate({ children, hasActiveChallenge }: AutoInvitationRedeemGateProps) {
  const queryClient = useQueryClient();
  const { actor, isFetching: actorFetching } = useActor();
  const redeemMutation = useRedeemInvitationCode();

  const [redeemState, setRedeemState] = useState<'idle' | 'checking' | 'redeeming' | 'success' | 'error'>('idle');
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [attemptKey, setAttemptKey] = useState(0);

  // Auto-redeem flow: check for persisted invitation and redeem if user has no active challenge
  useEffect(() => {
    // Only proceed if actor is ready and we haven't started yet
    if (!actor || actorFetching) return;
    if (redeemState !== 'idle') return;

    // Check for pending invitation
    const inviteParams = getPersistedInvitationParams();
    if (!inviteParams) return;

    // If user already has an active challenge, clear the pending invitation
    if (hasActiveChallenge) {
      clearPersistedInvitationParams();
      clearInvitationFromURL();
      return;
    }

    // Start redemption
    setRedeemState('redeeming');
    
    redeemMutation.mutateAsync(inviteParams)
      .then(() => {
        setRedeemState('success');
        // Clear invitation params from storage and URL
        clearPersistedInvitationParams();
        clearInvitationFromURL();
        
        // Refresh all relevant queries using centralized QUERY_KEYS
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userChallengeStatus });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeChallengeIdForCreator });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeChallengeIdForParticipant });
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.challengeParticipants(inviteParams.challengeId.toString()) 
        });
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.participantProfiles(inviteParams.challengeId.toString()) 
        });
      })
      .catch((error: any) => {
        setRedeemState('error');
        setRedeemError(sanitizeErrorMessage(error));
      });
  }, [actor, actorFetching, redeemState, hasActiveChallenge, attemptKey, queryClient]);

  const handleRetry = () => {
    setRedeemState('idle');
    setRedeemError(null);
    setAttemptKey(prev => prev + 1);
  };

  const handleDismiss = () => {
    clearPersistedInvitationParams();
    clearInvitationFromURL();
    setRedeemState('idle');
    setRedeemError(null);
  };

  // Show loading state during redemption
  if (redeemState === 'redeeming') {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Joining Challenge</CardTitle>
            <CardDescription className="text-center">
              Please wait while we add you to the challenge...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state with retry option
  if (redeemState === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[600px] px-6">
        <Card className="border-destructive/20 bg-destructive/5 max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Failed to Join Challenge
            </CardTitle>
            <CardDescription className="text-center">
              {redeemError || 'An error occurred while joining the challenge.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={handleRetry} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button onClick={handleDismiss} variant="ghost" className="w-full">
              Dismiss
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success or idle - render children
  return <>{children}</>;
}
