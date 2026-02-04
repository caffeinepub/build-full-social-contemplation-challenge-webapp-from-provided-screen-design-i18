import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/I18nContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { ArrowLeft, Calendar, Plus, Check, Loader2, Users, RefreshCw, X, Link as LinkIcon, Trash2, UserX } from 'lucide-react';
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
  useGetActiveChallengeIdForCreator,
  useGetChallengeStartTime,
  useUpdateStartTime
} from '../hooks/useQueries';
import { generateInvitationCode } from '../utils/invitationCodes';
import { buildInvitationLink } from '../utils/invitationLinks';
import { useAuthPrincipal } from '../hooks/useAuthPrincipal';
import { Principal } from '@icp-sdk/core/principal';
import { sanitizeErrorMessage, isChallengeNotFoundError } from '../utils/sanitizeErrorMessage';
import { clearPersistedActiveChallengeId } from '../utils/challengeContext';
import { useQueryClient } from '@tanstack/react-query';

interface Screen4PlaceholderProps {
  onNavigateBack?: () => void;
  onLeaveSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

export function Screen4Placeholder({ onNavigateBack, onLeaveSuccess, onDeleteSuccess }: Screen4PlaceholderProps) {
  const { t, direction } = useTranslation();
  const isRTL = direction === 'rtl';
  const { identity } = useAuthPrincipal();
  const queryClient = useQueryClient();

  // State for date input (no time)
  const [startDate, setStartDate] = useState('');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [confirmedChallengeId, setConfirmedChallengeId] = useState<bigint | null>(null);

  // Queries and mutations
  const createChallengeMutation = useCreateChallenge();
  const creatorChallengeQuery = useGetActiveChallengeIdForCreator();
  const managedChallengeId = useResolvedActiveChallengeId();
  const generateCodeMutation = useGenerateInvitationCode();
  const leaveMutation = useLeaveChallenge();
  const deleteMutation = useDeleteChallenge();
  const removeParticipantMutation = useRemoveParticipant();
  const updateStartTimeMutation = useUpdateStartTime();

  const invitationCodesQuery = useGetAvailableInvitationCodes(confirmedChallengeId);
  const participantsQuery = useGetChallengeParticipants(confirmedChallengeId);
  const participantProfilesQuery = useGetParticipantProfiles(participantsQuery.data);
  const allParticipantProfilesQuery = useGetAllChallengeParticipantProfiles(confirmedChallengeId);
  const startTimeQuery = useGetChallengeStartTime(confirmedChallengeId);

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

  // Load existing start time when managing a challenge
  useEffect(() => {
    if (confirmedChallengeId && startTimeQuery.data) {
      const startTimeMs = Number(startTimeQuery.data / BigInt(1_000_000));
      const date = new Date(startTimeMs);
      const dateStr = date.toISOString().split('T')[0];
      setStartDate(dateStr);
    }
  }, [confirmedChallengeId, startTimeQuery.data]);

  // Confirm challenge ID after successful backend resolution
  useEffect(() => {
    if (isChallengeManaged && managedChallengeId !== null) {
      // Only confirm if we don't have a confirmed ID yet, or if the managed ID changed
      if (confirmedChallengeId === null || confirmedChallengeId !== managedChallengeId) {
        setConfirmedChallengeId(managedChallengeId);
      }
    }
  }, [isChallengeManaged, managedChallengeId, confirmedChallengeId]);

  // Detect "Challenge not found" errors and clear stale state
  useEffect(() => {
    const errors = [
      invitationCodesQuery.error,
      participantsQuery.error,
      allParticipantProfilesQuery.error,
      startTimeQuery.error,
    ];

    for (const error of errors) {
      if (error && isChallengeNotFoundError(error)) {
        console.warn('Challenge not found - clearing stale context');
        clearPersistedActiveChallengeId();
        setConfirmedChallengeId(null);
        queryClient.invalidateQueries({ queryKey: ['activeChallengeIdCreator'] });
        queryClient.invalidateQueries({ queryKey: ['activeChallengeIdParticipant'] });
        queryClient.invalidateQueries({ queryKey: ['userChallengeStatus'] });
        break;
      }
    }
  }, [
    invitationCodesQuery.error,
    participantsQuery.error,
    allParticipantProfilesQuery.error,
    startTimeQuery.error,
    queryClient,
  ]);

  const handleSave = async () => {
    if (!startDate) return;

    try {
      const dateTimeStr = `${startDate}T00:00:00`;
      const timestamp = new Date(dateTimeStr).getTime();
      const nanoseconds = BigInt(timestamp) * BigInt(1_000_000);

      if (!isChallengeManaged) {
        // Create new challenge
        const newChallengeId = await createChallengeMutation.mutateAsync(nanoseconds);
        setConfirmedChallengeId(newChallengeId);
      } else if (isCreator && confirmedChallengeId) {
        // Update existing challenge start time
        await updateStartTimeMutation.mutateAsync({ 
          challengeId: confirmedChallengeId, 
          newStartTime: nanoseconds 
        });
      }
    } catch (error: any) {
      console.error('Failed to save challenge:', error);
      if (isChallengeNotFoundError(error)) {
        clearPersistedActiveChallengeId();
        setConfirmedChallengeId(null);
        queryClient.invalidateQueries({ queryKey: ['activeChallengeIdCreator'] });
        queryClient.invalidateQueries({ queryKey: ['activeChallengeIdParticipant'] });
        queryClient.invalidateQueries({ queryKey: ['userChallengeStatus'] });
      }
    }
  };

  const handleGenerateCode = async () => {
    if (!confirmedChallengeId) return;

    try {
      const code = generateInvitationCode(8);
      await generateCodeMutation.mutateAsync({ challengeId: confirmedChallengeId, code });
    } catch (error: any) {
      console.error('Failed to generate invitation code:', error);
      if (isChallengeNotFoundError(error)) {
        clearPersistedActiveChallengeId();
        setConfirmedChallengeId(null);
        queryClient.invalidateQueries({ queryKey: ['activeChallengeIdCreator'] });
        queryClient.invalidateQueries({ queryKey: ['activeChallengeIdParticipant'] });
        queryClient.invalidateQueries({ queryKey: ['userChallengeStatus'] });
      }
    }
  };

  const handleCopyLink = async (code: string) => {
    if (!confirmedChallengeId) return;
    
    try {
      const link = buildInvitationLink(confirmedChallengeId, code);
      await navigator.clipboard.writeText(link);
      setCopiedItem(`link-${code}`);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleLeaveChallenge = async () => {
    if (!confirmedChallengeId) return;

    try {
      await leaveMutation.mutateAsync(confirmedChallengeId);
      setConfirmedChallengeId(null);
      if (onLeaveSuccess) {
        onLeaveSuccess();
      }
    } catch (error: any) {
      console.error('Failed to leave challenge:', error);
      if (isChallengeNotFoundError(error)) {
        clearPersistedActiveChallengeId();
        setConfirmedChallengeId(null);
        queryClient.invalidateQueries({ queryKey: ['activeChallengeIdCreator'] });
        queryClient.invalidateQueries({ queryKey: ['activeChallengeIdParticipant'] });
        queryClient.invalidateQueries({ queryKey: ['userChallengeStatus'] });
      }
    }
  };

  const handleDeleteChallenge = async () => {
    if (!confirmedChallengeId) return;

    try {
      await deleteMutation.mutateAsync(confirmedChallengeId);
      setConfirmedChallengeId(null);
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error: any) {
      console.error('Failed to delete challenge:', error);
      if (isChallengeNotFoundError(error)) {
        clearPersistedActiveChallengeId();
        setConfirmedChallengeId(null);
        queryClient.invalidateQueries({ queryKey: ['activeChallengeIdCreator'] });
        queryClient.invalidateQueries({ queryKey: ['activeChallengeIdParticipant'] });
        queryClient.invalidateQueries({ queryKey: ['userChallengeStatus'] });
      }
    }
  };

  const handleRemoveParticipant = async (participantPrincipal: string) => {
    if (!confirmedChallengeId) return;

    try {
      const principal = Principal.fromText(participantPrincipal);
      await removeParticipantMutation.mutateAsync({ challengeId: confirmedChallengeId, participant: principal });
    } catch (error: any) {
      console.error('Failed to remove participant:', error);
      if (isChallengeNotFoundError(error)) {
        clearPersistedActiveChallengeId();
        setConfirmedChallengeId(null);
        queryClient.invalidateQueries({ queryKey: ['activeChallengeIdCreator'] });
        queryClient.invalidateQueries({ queryKey: ['activeChallengeIdParticipant'] });
        queryClient.invalidateQueries({ queryKey: ['userChallengeStatus'] });
      }
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
  const isSaving = createChallengeMutation.isPending || updateStartTimeMutation.isPending;
  const isGenerating = generateCodeMutation.isPending;
  const isLeaving = leaveMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  // Determine if queries are actually loading (not just disabled)
  const isCodesLoading = invitationCodesQuery.isLoading && invitationCodesQuery.fetchStatus === 'fetching';
  const isParticipantsLoading = (participantsQuery.isLoading || participantProfilesQuery.isLoading) && 
                                 (participantsQuery.fetchStatus === 'fetching' || participantProfilesQuery.fetchStatus === 'fetching');

  // Show Invitations and Participants only after Save succeeds and we have a confirmed challenge ID
  const showInvitationsAndParticipants = confirmedChallengeId !== null;

  return (
    <div className="flex flex-col min-h-[600px]">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent px-6 pt-12 pb-8">
        <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {onNavigateBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNavigateBack}
              className="flex-shrink-0"
            >
              {showInvitationsAndParticipants ? (
                <X className="w-5 h-5" />
              ) : (
                <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
              )}
            </Button>
          )}
          <h1 className={`text-2xl font-bold tracking-tight ${isRTL ? 'text-right' : 'text-left'} flex-1`}>
            {showInvitationsAndParticipants ? t('screen4.management.title') : t('screen4.title')}
          </h1>
        </div>
        <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : 'text-center'}`}>
          {showInvitationsAndParticipants ? t('screen4.management.subtitle') : t('screen4.subtitle')}
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-md mx-auto space-y-6">
          {/* Start Date Section - Always visible */}
          <Card>
            <CardHeader>
              <CardTitle className={isRTL ? 'text-right' : ''}>{t('screen4.form.title')}</CardTitle>
              <CardDescription className={isRTL ? 'text-right' : ''}>
                {showInvitationsAndParticipants ? 'Update the challenge start date' : t('screen4.form.description')}
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
                  disabled={showInvitationsAndParticipants && !isCreator}
                />
              </div>

              {/* Help Text */}
              <p className={`text-xs text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                {t('screen4.form.helpText')}
              </p>

              {/* Error Message */}
              {(createChallengeMutation.isError || updateStartTimeMutation.isError) && (
                <div className={`p-3 rounded-md bg-destructive/10 text-destructive text-sm ${isRTL ? 'text-right' : ''}`}>
                  {sanitizeErrorMessage(createChallengeMutation.error || updateStartTimeMutation.error)}
                </div>
              )}

              {/* Save Button */}
              {(!showInvitationsAndParticipants || isCreator) && (
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !startDate}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className={`w-4 h-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {showInvitationsAndParticipants ? 'Updating...' : 'Saving...'}
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Invitation URLs Section (creator only, only after Save) */}
          {showInvitationsAndParticipants && isCreator && (
            <Card>
              <CardHeader>
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <CardTitle className={isRTL ? 'text-right' : ''}>{t('screen4.codes.title')}</CardTitle>
                    <CardDescription className={isRTL ? 'text-right' : ''}>
                      Share these links to invite participants
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleGenerateCode}
                    disabled={isGenerating}
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

                {/* URLs List */}
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
                    {invitationCodes.map((code) => {
                      const link = buildInvitationLink(confirmedChallengeId!, code);
                      return (
                        <div
                          key={code}
                          className={`flex items-center justify-between gap-2 p-3 rounded-md bg-muted/50 ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground truncate font-mono">
                              {link}
                            </p>
                          </div>
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
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Participants Section (only after Save) */}
          {showInvitationsAndParticipants && (
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
                            {isCurrentUser ? (
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
                                    <AlertDialogTitle>{t('screen4.leave.title')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('screen4.leave.description')}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t('screen4.leave.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleLeaveChallenge}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      {t('screen4.leave.confirm')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
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
                      // Non-creator view: show basic participant list with leave option for current user
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
                            {isCurrentUser && (
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
                                    <AlertDialogTitle>{t('screen4.leave.title')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('screen4.leave.description')}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t('screen4.leave.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleLeaveChallenge}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      {t('screen4.leave.confirm')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Delete Challenge Section (creator only, only after Save) */}
          {showInvitationsAndParticipants && isCreator && (
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
