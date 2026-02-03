import { X, Users, RefreshCw, Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { InfoPopups } from '../components/InfoPopups';
import { useGetActiveChallengeIdForCreator, useGetChallengeParticipants, useLeaveChallenge } from '../hooks/useQueries';
import { getPersistedActiveChallengeId } from '../utils/challengeContext';

interface Screen5ManageChallengeProps {
  onClose?: () => void;
  onLeaveSuccess?: () => void;
}

export function Screen5ManageChallenge({ onClose, onLeaveSuccess }: Screen5ManageChallengeProps) {
  const { t, direction } = useTranslation();
  const isRTL = direction === 'rtl';

  // Get challenge ID
  const activeChallengeQuery = useGetActiveChallengeIdForCreator();
  const persistedChallengeId = getPersistedActiveChallengeId();
  const challengeId = activeChallengeQuery.data ?? persistedChallengeId;

  // Fetch participants
  const participantsQuery = useGetChallengeParticipants(challengeId);
  const participants = participantsQuery.data || [];

  // Leave challenge mutation
  const leaveMutation = useLeaveChallenge();

  const handleLeave = async () => {
    if (!challengeId) return;
    
    try {
      await leaveMutation.mutateAsync(challengeId);
      onLeaveSuccess?.();
    } catch (error) {
      console.error('Failed to leave challenge:', error);
    }
  };

  const handleRefresh = () => {
    participantsQuery.refetch();
  };

  return (
    <div className="flex flex-col min-h-[600px]">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent px-6 pt-12 pb-8">
        <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
          <h1 className={`text-2xl font-bold tracking-tight ${isRTL ? 'text-right' : 'text-center'} flex-1`}>
            {t('screen5.title')}
          </h1>
        </div>
        <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : 'text-center'}`}>
          {t('screen5.subtitle')}
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-8 space-y-6">
        {/* Participants Card */}
        <Card>
          <CardHeader>
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Users className="w-5 h-5" />
                <CardTitle>{t('screen5.participants.title')}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={participantsQuery.isLoading || participantsQuery.isFetching}
              >
                <RefreshCw className={`w-4 h-4 ${participantsQuery.isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <CardDescription>{t('screen5.participants.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {participantsQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : participants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('screen5.participants.empty')}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Leave Challenge Card */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">{t('screen5.leave.title')}</CardTitle>
            <CardDescription>{t('screen5.leave.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLeave}
              disabled={leaveMutation.isPending}
            >
              {leaveMutation.isPending ? (
                <>
                  <Loader2 className={`w-4 h-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('screen5.leave.leaving')}
                </>
              ) : (
                t('screen5.leave.button')
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info Popups */}
        <InfoPopups />
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
