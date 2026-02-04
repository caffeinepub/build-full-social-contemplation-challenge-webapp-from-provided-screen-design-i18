import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/I18nContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { ArrowLeft, Calendar, Plus, Copy, Check, Loader2, Users, RefreshCw, X, Link as LinkIcon, Trash2, UserX } from 'lucide-react';
import { 
  useCreateChallenge, 
  useResolvedActiveChallengeId,
  useGenerateInvitationCode,
  useGetAvailableInvitationCodes,
  useGetChallengeParticipants,
  useGetParticipantProfiles,
  useLeaveChallenge,
  useDeleteChallenge,
  useRemoveParticipant,
  useGetAllChallengeParticipantProfiles,
  useGetActiveChallengeIdForCreator
} from '../hooks/useQueries';
import { generateInvitationCode } from '../utils/invitationCodes';
import { buildInvitationLink } from '../utils/invitationLinks';
import { useAuthPrincipal } from '../hooks/useAuthPrincipal';
import { Principal } from '@icp-sdk/core/principal';
import { sanitizeErrorMessage } from '../utils/sanitizeErrorMessage';

interface Screen4PlaceholderProps {
  onNavigateBack?: () => void;
  onLeaveSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

export function Screen4Placeholder({ onNavigateBack, onLeaveSuccess, onDeleteSuccess }: Screen4PlaceholderProps) {
  const { t, direction } = useTranslation();
  const isRTL = direction === 'rtl';
  const { identity } = useAuthPrincipal();

  // State for date input (no time)
  const [startDate, setStartDate] = useState('');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Queries and mutations
  const createChallengeMutation = useCreateChallenge();
  const creatorChallengeQuery = useGetActiveChallengeIdForCreator();
  const managedChallengeId = useResolvedActiveChallengeId();
  const generateCodeMutation = useGenerateInvitationCode();
  const leaveMutation = useLeaveChallenge();
  const deleteMutation = useDeleteChallenge();
  const removeParticipantMutation = useRemoveParticipant();

  const invitationCodesQuery = useGetAvailableInvitationCodes(managedChallengeId);
  const participantsQuery = useGetChallengeParticipants(managedChallengeId);
  const participantProfilesQuery = useGetParticipantProfiles(participantsQuery.data);
  const allParticipantProfilesQuery = useGetAllChallengeParticipantProfiles(managedChallengeId);

  // Determine if user is the creator
  const isCreator = creatorChallengeQuery.data !== null && creatorChallengeQuery.data !== undefined;
  const isChallengeManaged = managedChallengeId !== null;

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setStartDate(dateStr);
  }, []);

  const handleCreateChallenge = async () => {
    if (!startDate) return;

    try {
      // Use start of day (00:00:00) for the selected date
      const dateTimeStr = `${startDate}T00:00:00`;
      const timestamp = new Date(dateTimeStr).getTime();
      const nanoseconds = BigInt(timestamp) * BigInt(1_000_000); // Convert to nanoseconds

      await createChallengeMutation.mutateAsync(nanoseconds);
    } catch (error: any) {
      console.error('Failed to create challenge:', error);
    }
  };

  const handleGenerateCode = async () => {
    if (!managedChallengeId) return;

    try {
      const code = generateInvitationCode(8);
      await generateCodeMutation.mutateAsync({ challengeId: managedChallengeId, code });
    } catch (error: any) {
      console.error('Failed to generate invitation code:', error);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedItem(`code-${code}`);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleCopyLink = async (code: string) => {
    if (!managedChallengeId) return;
    
    try {
      const link = buildInvitationLink(managedChallengeId, code);
      await navigator.clipboard.writeText(link);
      setCopiedItem(`link-${code}`);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleLeaveChallenge = async () => {
    if (!managedChallengeId) return;

    try {
      await leaveMutation.mutateAsync(managedChallengeId);
      // Navigate back after successful leave
      if (onLeaveSuccess) {
        onLeaveSuccess();
      }
    } catch (error: any) {
      console.error('Failed to leave challenge:', error);
    }
  };

  const handleDeleteChallenge = async () => {
    if (!managedChallengeId) return;

    try {
      await deleteMutation.mutateAsync(managedChallengeId);
      // Navigate back after successful delete
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error: any) {
      console.error('Failed to delete challenge:', error);
    }
  };

  const handleRemoveParticipant = async (participantPrincipal: string) => {
    if (!managedChallengeId) return;

    try {
      const principal = Principal.fromText(participantPrincipal);
      await removeParticipantMutation.mutateAsync({ challengeId: managedChallengeId, participant: principal });
    } catch (error: any) {
      console.error('Failed to remove participant:', error);
    }
  };

  const handleRefreshParticipants = () => {
    participantsQuery.refetch();
    participantProfilesQuery.refetch();
    allParticipantProfilesQuery.refetch();
  };

  const invitationCodes = invitationCodesQuery.data || [];
  const participantProfiles = participantProfilesQuery.data || [];
  const allParticipantProfiles = allParticipantProfilesQuery.data || [];
  const isCreating = createChallengeMutation.isPending;
  const isGenerating = generateCodeMutation.isPending;
  const isLeaving = leaveMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  // Determine if queries are actually loading (not just disabled)
  const isCodesLoading = invitationCodesQuery.isLoading && invitationCodesQuery.fetchStatus === 'fetching';
  const isParticipantsLoading = (participantsQuery.isLoading || participantProfilesQuery.isLoading) && 
                                 (participantsQuery.fetchStatus === 'fetching' || participantProfilesQuery.fetchStatus === 'fetching');

  return (
    <div className="flex flex-col min-h-[600px]">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent px-6 pt-12 pb-8">
        <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {onNavigateBack && !isChallengeManaged && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNavigateBack}
              className="flex-shrink-0"
            >
              <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
          )}
          {onNavigateBack && isChallengeManaged && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNavigateBack}
              className="flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
          <h1 className={`text-2xl font-bold tracking-tight ${isRTL ? 'text-right' : 'text-left'} flex-1`}>
            {isChallengeManaged ? t('screen4.management.title') : t('screen4.title')}
          </h1>
        </div>
        <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : 'text-center'}`}>
          {isChallengeManaged ? t('screen4.management.subtitle') : t('screen4.subtitle')}
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-8">
        {!isChallengeManaged ? (
          // Challenge Creation Form
          <div className="max-w-md mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className={isRTL ? 'text-right' : ''}>{t('screen4.form.title')}</CardTitle>
                <CardDescription className={isRTL ? 'text-right' : ''}>
                  {t('screen4.form.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Input */}
                <div className="space-y-2">
                  <Label htmlFor="start-date" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <Calendar className="w-4 h-4" />
                    {t('screen4.form.startDate')}
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={isRTL ? 'text-right' : ''}
                  />
                </div>

                {/* Help Text */}
                <p className={`text-xs text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                  {t('screen4.form.helpText')}
                </p>

                {/* Error Message */}
                {createChallengeMutation.isError && (
                  <div className={`p-3 rounded-md bg-destructive/10 text-destructive text-sm ${isRTL ? 'text-right' : ''}`}>
                    {sanitizeErrorMessage(createChallengeMutation.error)}
                  </div>
                )}

                {/* Create Button */}
                <Button
                  onClick={handleCreateChallenge}
                  disabled={isCreating || !startDate}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className={`w-4 h-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('screen4.form.creating')}
                    </>
                  ) : (
                    t('screen4.form.createButton')
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Challenge Management View
          <div className="max-w-md mx-auto space-y-6">
            {/* Success Message (only for creators) */}
            {isCreator && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className={`text-primary ${isRTL ? 'text-right' : ''}`}>
                    {t('screen4.created.title')}
                  </CardTitle>
                  <CardDescription className={isRTL ? 'text-right' : ''}>
                    {t('screen4.created.description')}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Invitation Codes Section (creator only) */}
            {isCreator && (
              <Card>
                <CardHeader>
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div>
                      <CardTitle className={isRTL ? 'text-right' : ''}>{t('screen4.codes.title')}</CardTitle>
                      <CardDescription className={isRTL ? 'text-right' : ''}>
                        {t('screen4.codes.description')}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleGenerateCode}
                      disabled={isGenerating || !managedChallengeId}
                      size="sm"
                      className="flex-shrink-0"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                          {t('screen4.codes.generate')}
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Error Message */}
                  {generateCodeMutation.isError && (
                    <div className={`mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm ${isRTL ? 'text-right' : ''}`}>
                      {sanitizeErrorMessage(generateCodeMutation.error)}
                    </div>
                  )}

                  {/* Codes List */}
                  {isCodesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : invitationCodes.length === 0 ? (
                    <p className={`text-sm text-muted-foreground text-center py-8 ${isRTL ? 'text-right' : ''}`}>
                      {t('screen4.codes.empty')}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {invitationCodes.map((code) => (
                        <div
                          key={code}
                          className={`flex items-center justify-between p-3 rounded-md bg-muted/50 ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                          <code className="font-mono font-semibold text-lg tracking-wider">
                            {code}
                          </code>
                          <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyCode(code)}
                              className="flex-shrink-0"
                            >
                              {copiedItem === `code-${code}` ? (
                                <>
                                  <Check className={`w-4 h-4 text-primary ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                  {t('screen4.codes.copied')}
                                </>
                              ) : (
                                <>
                                  <Copy className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                  {t('screen4.codes.copy')}
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(code)}
                              className="flex-shrink-0"
                            >
                              {copiedItem === `link-${code}` ? (
                                <>
                                  <Check className={`w-4 h-4 text-primary ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                  {t('screen4.codes.linkCopied')}
                                </>
                              ) : (
                                <>
                                  <LinkIcon className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                  {t('screen4.codes.copyLink')}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Participants Section */}
            <Card>
              <CardHeader>
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Users className="w-5 h-5" />
                      {t('screen4.participants.title')}
                    </CardTitle>
                    <CardDescription className={isRTL ? 'text-right' : ''}>
                      {t('screen4.participants.description')}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleRefreshParticipants}
                    disabled={participantsQuery.isFetching}
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${participantsQuery.isFetching ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isParticipantsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (isCreator ? allParticipantProfiles : participantProfiles).length === 0 ? (
                  <p className={`text-sm text-muted-foreground text-center py-8 ${isRTL ? 'text-right' : ''}`}>
                    {t('screen4.participants.empty')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {isCreator ? (
                      // Creator view: show all profiles with remove option
                      allParticipantProfiles.map(([principal, profile]) => {
                        const isCurrentUser = identity?.getPrincipal().toString() === principal.toString();
                        return (
                          <div
                            key={principal.toString()}
                            className={`flex items-center justify-between p-3 rounded-md bg-muted/30 ${isRTL ? 'flex-row-reverse' : ''}`}
                          >
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {profile?.name?.charAt(0).toUpperCase() || '?'}
                                </span>
                              </div>
                              <span className="text-sm font-medium">
                                {profile?.name || t('screen4.participants.unknownUser')}
                                {isCurrentUser && ` (${t('screen4.participants.you')})`}
                              </span>
                            </div>
                            {!isCurrentUser && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <UserX className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t('screen4.remove.title')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('screen4.remove.description')}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t('screen4.remove.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRemoveParticipant(principal.toString())}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      {t('screen4.remove.confirm')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      // Non-creator view: show basic participant list
                      participantProfiles.map((profile) => {
                        const isCurrentUser = identity?.getPrincipal().toString() === profile.principal;
                        return (
                          <div
                            key={profile.principal}
                            className={`flex items-center justify-between p-3 rounded-md bg-muted/30 ${isRTL ? 'flex-row-reverse' : ''}`}
                          >
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {profile.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-sm font-medium">
                                {profile.name}
                                {isCurrentUser && ` (${t('screen4.participants.you')})`}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delete Challenge Section (creator only) */}
            {isCreator && (
              <Card className="border-destructive/20">
                <CardHeader>
                  <CardTitle className={`text-destructive ${isRTL ? 'text-right' : ''}`}>
                    {t('screen4.delete.title')}
                  </CardTitle>
                  <CardDescription className={isRTL ? 'text-right' : ''}>
                    {t('screen4.delete.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {deleteMutation.isError && (
                    <div className={`mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm ${isRTL ? 'text-right' : ''}`}>
                      {sanitizeErrorMessage(deleteMutation.error)}
                    </div>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={isDeleting}
                        variant="destructive"
                        className="w-full"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className={`w-4 h-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('screen4.delete.deleting')}
                          </>
                        ) : (
                          <>
                            <Trash2 className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('screen4.delete.button')}
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('screen4.delete.confirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('screen4.delete.confirmDescription')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('screen4.delete.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteChallenge}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {t('screen4.delete.confirmButton')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            )}

            {/* Leave Challenge Section (non-creators only) */}
            {!isCreator && (
              <Card className="border-destructive/20">
                <CardHeader>
                  <CardTitle className={`text-destructive ${isRTL ? 'text-right' : ''}`}>
                    {t('screen4.leave.title')}
                  </CardTitle>
                  <CardDescription className={isRTL ? 'text-right' : ''}>
                    {t('screen4.leave.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {leaveMutation.isError && (
                    <div className={`mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm ${isRTL ? 'text-right' : ''}`}>
                      {sanitizeErrorMessage(leaveMutation.error)}
                    </div>
                  )}
                  <Button
                    onClick={handleLeaveChallenge}
                    disabled={isLeaving}
                    variant="destructive"
                    className="w-full"
                  >
                    {isLeaving ? (
                      <>
                        <Loader2 className={`w-4 h-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('screen4.leave.leaving')}
                      </>
                    ) : (
                      t('screen4.leave.button')
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
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
