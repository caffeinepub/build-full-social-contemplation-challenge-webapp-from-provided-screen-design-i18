import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/I18nContext';
import { InfoPopups } from '../components/InfoPopups';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useRedeemInvitationCode } from '../hooks/useQueries';
import { getPersistedInvitationParams, clearPersistedInvitationParams } from '../utils/urlParams';
import { clearInvitationFromURL } from '../utils/invitationLinks';
import { sanitizeErrorMessage } from '../utils/sanitizeErrorMessage';
import { clearPersistedActiveChallengeId } from '../utils/challengeContext';
import { useQueryClient } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';

interface Screen3PlaceholderProps {
  onNavigateToScreen4?: () => void;
  onJoinSuccess?: () => void;
  hasInconsistentState?: boolean;
}

export function Screen3Placeholder({ onNavigateToScreen4, onJoinSuccess, hasInconsistentState }: Screen3PlaceholderProps) {
  const { t, direction } = useTranslation();
  const isRTL = direction === 'rtl';
  const queryClient = useQueryClient();
  const { actor, isFetching: actorFetching } = useActor();

  const [autoRedeemState, setAutoRedeemState] = useState<'idle' | 'redeeming' | 'success' | 'error'>('idle');
  const [autoRedeemError, setAutoRedeemError] = useState<string | null>(null);

  const redeemMutation = useRedeemInvitationCode();

  // Auto-redeem flow: check for persisted invitation params and redeem automatically
  useEffect(() => {
    if (!actor || actorFetching) return;
    if (autoRedeemState !== 'idle') return;

    const inviteParams = getPersistedInvitationParams();
    if (inviteParams) {
      setAutoRedeemState('redeeming');
      
      redeemMutation.mutateAsync(inviteParams)
        .then(() => {
          setAutoRedeemState('success');
          clearPersistedInvitationParams();
          clearInvitationFromURL();
          // Navigate to in-challenge screen
          if (onJoinSuccess) {
            setTimeout(() => onJoinSuccess(), 500);
          }
        })
        .catch((error: any) => {
          setAutoRedeemState('error');
          setAutoRedeemError(sanitizeErrorMessage(error));
        });
    }
  }, [actor, actorFetching, autoRedeemState, onJoinSuccess]);

  const handleRefreshState = () => {
    queryClient.invalidateQueries({ queryKey: ['userChallengeStatus'] });
    queryClient.invalidateQueries({ queryKey: ['activeChallengeIdCreator'] });
    queryClient.invalidateQueries({ queryKey: ['activeChallengeIdParticipant'] });
  };

  const handleRetryRedeem = () => {
    setAutoRedeemState('idle');
    setAutoRedeemError(null);
  };

  const handleDismissInvite = () => {
    clearPersistedInvitationParams();
    clearInvitationFromURL();
    setAutoRedeemState('idle');
    setAutoRedeemError(null);
  };

  const handleNavigateToCreateChallenge = () => {
    // Clear any stale persisted challenge ID before navigating to create mode
    clearPersistedActiveChallengeId();
    if (onNavigateToScreen4) {
      onNavigateToScreen4();
    }
  };

  // Show auto-redeem loading state
  if (autoRedeemState === 'redeeming') {
    return (
      <div className="flex flex-col min-h-[600px]">
        <div className="bg-gradient-to-b from-primary/5 to-transparent px-6 pt-12 pb-8">
          <div className={`text-center space-y-3 ${isRTL ? 'text-right' : ''}`}>
            <h1 className="text-4xl font-bold tracking-tight">
              {t('app.title')}
            </h1>
          </div>
        </div>
        <div className="flex-1 px-6 py-8 flex items-center justify-center">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">{t('screen3.join.joining')}</CardTitle>
              <CardDescription className="text-center">
                Joining challenge...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show auto-redeem error state
  if (autoRedeemState === 'error') {
    return (
      <div className="flex flex-col min-h-[600px]">
        <div className="bg-gradient-to-b from-primary/5 to-transparent px-6 pt-12 pb-8">
          <div className={`text-center space-y-3 ${isRTL ? 'text-right' : ''}`}>
            <h1 className="text-4xl font-bold tracking-tight">
              {t('app.title')}
            </h1>
          </div>
        </div>
        <div className="flex-1 px-6 py-8 flex items-center justify-center">
          <Card className="border-destructive/20 bg-destructive/5 max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive text-center">Failed to Join Challenge</CardTitle>
              <CardDescription className="text-center">
                {autoRedeemError || 'An error occurred while joining the challenge.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={handleRetryRedeem} variant="outline" className="w-full">
                <RefreshCw className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                Retry
              </Button>
              <Button onClick={handleDismissInvite} variant="ghost" className="w-full">
                Dismiss
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[600px]">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent px-6 pt-12 pb-8">
        <div className={`text-center space-y-3 ${isRTL ? 'text-right' : ''}`}>
          <h1 className="text-4xl font-bold tracking-tight">
            {t('app.title')}
          </h1>
          <p className="text-base text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {t('screen3.welcomeBack')}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-8 space-y-6">
        {/* Status Card */}
        <div className="bg-muted/30 rounded-xl p-5 space-y-3">
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🎯</span>
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold text-sm mb-1 ${isRTL ? 'text-right' : ''}`}>
                {t('screen3.noActiveChallenge.title')}
              </h3>
              <p className={`text-xs text-muted-foreground leading-relaxed ${isRTL ? 'text-right' : ''}`}>
                {t('screen3.noActiveChallenge.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Recovery UI for inconsistent state */}
        {hasInconsistentState && (
          <Card className="border-warning/20 bg-warning/5">
            <CardHeader>
              <CardTitle className={`text-warning text-sm ${isRTL ? 'text-right' : ''}`}>
                State Recovery
              </CardTitle>
              <CardDescription className={isRTL ? 'text-right' : ''}>
                Your challenge state needs to be refreshed. Click below to reload.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleRefreshState}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                Refresh State
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info Dialogs */}
        <InfoPopups />

        {/* Options Section */}
        <div className="space-y-3">
          <h3 className={`text-sm font-semibold text-center text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
            {t('screen3.whatNext')}
          </h3>
          
          <div className="space-y-2">
            <Button 
              onClick={handleNavigateToCreateChallenge}
              className="w-full"
              size="lg"
            >
              {t('screen3.createChallenge')}
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`px-6 pb-6 text-center ${isRTL ? 'text-right' : ''}`}>
        <p className="text-xs text-muted-foreground">
          {t('screen1.footer').split('caffeine.ai')[0]}
          <a 
            href="https://caffeine.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
