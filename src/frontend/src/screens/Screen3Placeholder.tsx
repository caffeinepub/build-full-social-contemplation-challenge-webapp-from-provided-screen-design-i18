import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/I18nContext';
import { InfoPopups } from '../components/InfoPopups';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useRedeemInvitationCode } from '../hooks/useQueries';
import { parseInvitationFromURL, clearInvitationFromURL } from '../utils/invitationLinks';
import { sanitizeErrorMessage } from '../utils/sanitizeErrorMessage';
import { useQueryClient } from '@tanstack/react-query';

const INVITATION_STORAGE_KEY = 'social_contemplation_pending_invitation';

interface InvitationParams {
  challengeId: bigint;
  code: string;
}

function persistInvitationParams(params: InvitationParams): void {
  try {
    sessionStorage.setItem(INVITATION_STORAGE_KEY, JSON.stringify({
      challengeId: params.challengeId.toString(),
      code: params.code,
    }));
  } catch (error) {
    console.error('Failed to persist invitation params:', error);
  }
}

function getPersistedInvitationParams(): InvitationParams | null {
  try {
    const stored = sessionStorage.getItem(INVITATION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        challengeId: BigInt(parsed.challengeId),
        code: parsed.code,
      };
    }
  } catch (error) {
    console.error('Failed to retrieve persisted invitation params:', error);
  }
  return null;
}

function clearPersistedInvitationParams(): void {
  try {
    sessionStorage.removeItem(INVITATION_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear persisted invitation params:', error);
  }
}

interface Screen3PlaceholderProps {
  onNavigateToScreen4?: () => void;
  hasInconsistentState?: boolean;
}

export function Screen3Placeholder({ onNavigateToScreen4, hasInconsistentState }: Screen3PlaceholderProps) {
  const { t, direction } = useTranslation();
  const isRTL = direction === 'rtl';
  const queryClient = useQueryClient();

  const [showJoinForm, setShowJoinForm] = useState(false);
  const [challengeIdInput, setChallengeIdInput] = useState('');
  const [codeInput, setCodeInput] = useState('');

  const redeemMutation = useRedeemInvitationCode();

  // Check for invitation params on mount
  useEffect(() => {
    const urlParams = parseInvitationFromURL();
    if (urlParams) {
      // Persist to sessionStorage and clear from URL
      persistInvitationParams(urlParams);
      clearInvitationFromURL();
      
      // Pre-fill the form
      setChallengeIdInput(urlParams.challengeId.toString());
      setCodeInput(urlParams.code);
      setShowJoinForm(true);
    } else {
      // Check if we have persisted params
      const persisted = getPersistedInvitationParams();
      if (persisted) {
        setChallengeIdInput(persisted.challengeId.toString());
        setCodeInput(persisted.code);
        setShowJoinForm(true);
      }
    }
  }, []);

  const handleJoinClick = () => {
    setShowJoinForm(true);
  };

  const handleCancelJoin = () => {
    setShowJoinForm(false);
    setChallengeIdInput('');
    setCodeInput('');
    clearPersistedInvitationParams();
  };

  const handleSubmitJoin = async () => {
    if (!challengeIdInput || !codeInput) return;

    try {
      const challengeId = BigInt(challengeIdInput);
      await redeemMutation.mutateAsync({ challengeId, code: codeInput });
      // Clear persisted params on success
      clearPersistedInvitationParams();
      // The mutation will trigger a state refresh, and App.tsx will navigate to Screen 6
    } catch (error: any) {
      console.error('Failed to join challenge:', error);
    }
  };

  const handleRefreshState = () => {
    queryClient.invalidateQueries({ queryKey: ['userChallengeStatus'] });
    queryClient.invalidateQueries({ queryKey: ['activeChallengeIdCreator'] });
    queryClient.invalidateQueries({ queryKey: ['activeChallengeIdParticipant'] });
  };

  const isSubmitting = redeemMutation.isPending;
  const canSubmit = challengeIdInput.trim() !== '' && codeInput.trim() !== '' && !isSubmitting;

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
        {!showJoinForm ? (
          <>
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
                  onClick={onNavigateToScreen4}
                  className="w-full"
                  size="lg"
                >
                  {t('screen3.createChallenge')}
                </Button>
                
                <Button 
                  onClick={handleJoinClick}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  {t('screen3.joinChallenge')}
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Join Form
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className={isRTL ? 'text-right' : ''}>{t('screen3.join.title')}</CardTitle>
                <CardDescription className={isRTL ? 'text-right' : ''}>
                  {t('screen3.join.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Challenge ID Input */}
                <div className="space-y-2">
                  <Label htmlFor="challenge-id" className={isRTL ? 'text-right block' : ''}>
                    {t('screen3.join.challengeIdLabel')}
                  </Label>
                  <Input
                    id="challenge-id"
                    type="text"
                    placeholder={t('screen3.join.challengeIdPlaceholder')}
                    value={challengeIdInput}
                    onChange={(e) => setChallengeIdInput(e.target.value)}
                    className={isRTL ? 'text-right' : ''}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Code Input */}
                <div className="space-y-2">
                  <Label htmlFor="invitation-code" className={isRTL ? 'text-right block' : ''}>
                    {t('screen3.join.codeLabel')}
                  </Label>
                  <Input
                    id="invitation-code"
                    type="text"
                    placeholder={t('screen3.join.codePlaceholder')}
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    className={`font-mono ${isRTL ? 'text-right' : ''}`}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Error Message */}
                {redeemMutation.isError && (
                  <div className={`p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-start gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className={isRTL ? 'text-right' : ''}>
                      {sanitizeErrorMessage(redeemMutation.error)}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Button
                    onClick={handleCancelJoin}
                    variant="outline"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {t('screen3.join.cancel')}
                  </Button>
                  <Button
                    onClick={handleSubmitJoin}
                    disabled={!canSubmit}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className={`w-4 h-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('screen3.join.joining')}
                      </>
                    ) : (
                      t('screen3.join.submit')
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
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
