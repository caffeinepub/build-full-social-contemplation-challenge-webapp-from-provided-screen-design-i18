import { useTranslation } from '../i18n/I18nContext';
import { InfoPopups } from '../components/InfoPopups';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { RefreshCw } from 'lucide-react';
import { clearPersistedActiveChallengeId } from '../utils/challengeContext';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../hooks/useQueries';

interface Screen3PlaceholderProps {
  onNavigateToScreen4?: () => void;
  onJoinSuccess?: () => void;
  hasInconsistentState?: boolean;
}

export function Screen3Placeholder({ onNavigateToScreen4, hasInconsistentState }: Screen3PlaceholderProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const handleRefreshState = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userChallengeStatus });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeChallengeIdForCreator });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeChallengeIdForParticipant });
  };

  const handleNavigateToCreateChallenge = () => {
    // Clear any stale persisted challenge ID before navigating to create mode
    clearPersistedActiveChallengeId();
    if (onNavigateToScreen4) {
      onNavigateToScreen4();
    }
  };

  return (
    <div className="flex flex-col min-h-[600px]">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent px-6 pt-12 pb-8">
        <div className="text-center space-y-3">
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🎯</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">
                {t('screen3.noActiveChallenge.title')}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('screen3.noActiveChallenge.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Recovery UI for inconsistent state */}
        {hasInconsistentState && (
          <Card className="border-warning/20 bg-warning/5">
            <CardHeader>
              <CardTitle className="text-warning text-sm">
                State Recovery
              </CardTitle>
              <CardDescription>
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
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh State
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info Dialogs */}
        <InfoPopups />

        {/* Options Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-center text-muted-foreground">
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
      <div className="px-6 pb-6 text-center">
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
