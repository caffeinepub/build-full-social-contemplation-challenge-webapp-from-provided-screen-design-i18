import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/I18nContext';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { SharedPopup } from '../components/SharedPopup';
import { ScrollArea } from '../components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Settings, Mic, Play, Trash2, Loader2, Users, Info, Square, User, MessageCircle, CheckCircle2 } from 'lucide-react';
import { 
  useResolvedActiveChallengeId,
  useGetAllChallengeParticipantProfiles,
  useSaveRecording,
  useGetRecording,
  useDeleteRecording,
  useGetParticipantRecording,
  useGetChallengeStartTime
} from '../hooks/useQueries';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { RecordingFeedback } from '../components/RecordingFeedback';
import { ExternalBlob } from '../backend';
import { FIXED_ASSIGNMENTS, clampDay } from '../utils/assignments';
import { sanitizeErrorMessage } from '../utils/sanitizeErrorMessage';
import { formatDayHeader } from '../utils/challengeDayFormat';
import { readAppUrlState, writeAppUrlState } from '../utils/appUrlState';
import type { Principal } from '@icp-sdk/core/principal';

interface Screen6InChallengeProps {
  onNavigateToManage?: () => void;
}

// Maximum days for the 7-day challenge
const MAX_DAYS = 7;

export function Screen6InChallenge({ onNavigateToManage }: Screen6InChallengeProps) {
  const { t, direction } = useTranslation();
  const isRTL = direction === 'rtl';
  
  // Initialize state from URL
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('my');
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedParticipant, setSelectedParticipant] = useState<Principal | null>(null);
  const [selectedParticipantDay, setSelectedParticipantDay] = useState(1);
  
  // Track which assignment is currently being recorded
  const [recordingAssignment, setRecordingAssignment] = useState<string | null>(null);
  
  // Track which assignment audio is currently playing
  const [playingAssignment, setPlayingAssignment] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get challenge ID using unified resolver
  const challengeId = useResolvedActiveChallengeId();

  // Fetch challenge start time
  const startTimeQuery = useGetChallengeStartTime(challengeId);

  // Fetch participant profiles
  const participantProfilesQuery = useGetAllChallengeParticipantProfiles(challengeId);

  // Audio recording hook with live feedback
  const { startRecording, stopRecording, clearRecording, recordedBlob, isRecording, error: recordingError, audioLevel, elapsedSeconds } = useAudioRecording();

  // Mutations
  const saveRecordingMutation = useSaveRecording();
  const deleteRecordingMutation = useDeleteRecording();

  // Initialize from URL on mount
  useEffect(() => {
    if (!isInitialized) {
      const urlState = readAppUrlState();
      
      if (urlState.tab) {
        setActiveTab(urlState.tab);
      }
      
      if (urlState.day) {
        const day = parseInt(urlState.day, 10);
        if (!isNaN(day)) {
          setSelectedDay(clampDay(day));
        }
      }
      
      if (urlState.participant) {
        try {
          // Parse principal from URL
          const principal = urlState.participant;
          // We'll set it after profiles load
          setSelectedParticipant(principal as any);
        } catch (e) {
          console.error('Failed to parse participant from URL:', e);
        }
      }
      
      if (urlState.participantDay) {
        const day = parseInt(urlState.participantDay, 10);
        if (!isNaN(day)) {
          setSelectedParticipantDay(clampDay(day));
        }
      }
      
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Sync tab changes to URL
  useEffect(() => {
    if (isInitialized) {
      writeAppUrlState({ tab: activeTab });
    }
  }, [activeTab, isInitialized]);

  // Sync day changes to URL
  useEffect(() => {
    if (isInitialized) {
      writeAppUrlState({ day: selectedDay.toString() });
    }
  }, [selectedDay, isInitialized]);

  // Sync participant changes to URL
  useEffect(() => {
    if (isInitialized) {
      writeAppUrlState({ 
        participant: selectedParticipant?.toString() || undefined 
      });
    }
  }, [selectedParticipant, isInitialized]);

  // Sync participant day changes to URL
  useEffect(() => {
    if (isInitialized) {
      writeAppUrlState({ 
        participantDay: selectedParticipantDay.toString() 
      });
    }
  }, [selectedParticipantDay, isInitialized]);

  // Clamp day selection to valid range (1-7)
  const handleDaySelection = (day: number) => {
    const clamped = clampDay(day);
    setSelectedDay(clamped);
  };

  const handleParticipantDaySelection = (day: number) => {
    const clamped = clampDay(day);
    setSelectedParticipantDay(clamped);
  };

  // Recording handlers
  const handleStartRecording = async (assignmentId: string) => {
    setRecordingAssignment(assignmentId);
    clearRecording();
    await startRecording();
  };

  const handleStopRecording = async () => {
    await stopRecording();
  };

  // Save recording after stopping
  useEffect(() => {
    if (recordedBlob && recordingAssignment && !isRecording && challengeId) {
      const saveRecording = async () => {
        try {
          const arrayBuffer = await recordedBlob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const externalBlob = ExternalBlob.fromBytes(uint8Array);
          
          await saveRecordingMutation.mutateAsync({
            challengeId,
            day: selectedDay,
            assignment: recordingAssignment,
            recording: externalBlob,
          });
          
          // Clear the recorded blob after successful save
          clearRecording();
          setRecordingAssignment(null);
        } catch (error) {
          console.error('Failed to save recording:', sanitizeErrorMessage(error));
        }
      };
      saveRecording();
    }
  }, [recordedBlob, recordingAssignment, isRecording, challengeId, selectedDay, saveRecordingMutation, clearRecording]);

  const handleDeleteRecording = async (assignmentId: string) => {
    if (!challengeId) return;
    
    try {
      await deleteRecordingMutation.mutateAsync({
        challengeId,
        day: selectedDay,
        assignment: assignmentId,
      });
    } catch (error) {
      console.error('Failed to delete recording:', sanitizeErrorMessage(error));
    }
  };

  const handlePlayRecording = async (blob: ExternalBlob, assignmentId: string) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingAssignment === assignmentId) {
      setPlayingAssignment(null);
      return;
    }

    try {
      const url = blob.getDirectURL();
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
        setPlayingAssignment(null);
        audioRef.current = null;
      };
      
      audio.onerror = () => {
        setPlayingAssignment(null);
        audioRef.current = null;
        console.error('Failed to play audio');
      };
      
      setPlayingAssignment(assignmentId);
      await audio.play();
    } catch (error) {
      console.error('Failed to play recording:', sanitizeErrorMessage(error));
      setPlayingAssignment(null);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const participantProfiles = participantProfilesQuery.data || [];

  // Format day header with weekday and date
  const dayHeader = formatDayHeader(startTimeQuery.data, selectedDay);
  const participantDayHeader = formatDayHeader(startTimeQuery.data, selectedParticipantDay);

  return (
    <div className="flex flex-col min-h-[600px]">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent px-4 sm:px-6 pt-12 pb-8">
        <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isRTL ? 'text-right' : 'text-left'} flex-1`}>
            {t('screen6.title')}
          </h1>
          {onNavigateToManage && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNavigateToManage}
              className="flex-shrink-0"
            >
              <Settings className="w-5 h-5" />
            </Button>
          )}
        </div>
        <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : 'text-center'}`}>
          {t('screen6.subtitle')}
        </p>
      </div>

      {/* Main Content with Tabs */}
      <div className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my" aria-label="My">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="sr-only">My</span>
            </TabsTrigger>
            <TabsTrigger value="team" aria-label="Team">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="sr-only">Team</span>
            </TabsTrigger>
            <TabsTrigger value="coming" aria-label="Coming Soon">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="sr-only">Coming Soon</span>
            </TabsTrigger>
          </TabsList>

          {/* My Tab */}
          <TabsContent value="my" className="space-y-4 mt-6">
            {/* Day Header with weekday and date */}
            <div className={`text-center ${isRTL ? 'text-right' : ''}`}>
              <h2 className="text-base sm:text-lg font-semibold">{dayHeader}</h2>
            </div>

            {/* Day Selector - Separate label with numeric-only buttons */}
            <div className="space-y-2">
              <p className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                Day
              </p>
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {Array.from({ length: MAX_DAYS }, (_, i) => i + 1).map((day) => (
                  <Button
                    key={day}
                    variant={selectedDay === day ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDaySelection(day)}
                    className="w-full text-xs sm:text-sm"
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>

            {/* Assignments for Selected Day */}
            <div className="space-y-3">
              {FIXED_ASSIGNMENTS.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  challengeId={challengeId}
                  day={selectedDay}
                  isRTL={isRTL}
                  recordingAssignment={recordingAssignment}
                  playingAssignment={playingAssignment}
                  isRecording={isRecording}
                  recordingError={recordingError}
                  audioLevel={audioLevel}
                  elapsedSeconds={elapsedSeconds}
                  onStartRecording={handleStartRecording}
                  onStopRecording={handleStopRecording}
                  onPlayRecording={handlePlayRecording}
                  onDeleteRecording={handleDeleteRecording}
                  saveRecordingMutation={saveRecordingMutation}
                  deleteRecordingMutation={deleteRecordingMutation}
                />
              ))}
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4 mt-6">
            {/* Participants List */}
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 text-base sm:text-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t('screen6.team.participants')}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">{t('screen6.team.participantsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                {participantProfilesQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : participantProfiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {t('screen6.team.noParticipants')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {participantProfiles.map(([principal, profile]) => (
                      <div
                        key={principal.toString()}
                        className={`flex items-center justify-between p-3 rounded-md transition-colors ${
                          selectedParticipant?.toString() === principal.toString()
                            ? 'bg-primary/10 border border-primary/20'
                            : 'bg-muted/30 hover:bg-muted/50 cursor-pointer'
                        } ${isRTL ? 'flex-row-reverse' : ''}`}
                        onClick={() => setSelectedParticipant(principal)}
                      >
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {profile?.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <span className="text-sm font-medium">
                            {profile?.name || t('screen6.team.unknownUser')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected Participant Recordings */}
            {selectedParticipant && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">{t('screen6.team.recordings')}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{t('screen6.team.recordingsDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Day Header with weekday and date */}
                  <div className={`text-center ${isRTL ? 'text-right' : ''}`}>
                    <h3 className="text-sm sm:text-base font-semibold">{participantDayHeader}</h3>
                  </div>

                  {/* Day Selector for Team - Separate label with numeric-only buttons */}
                  <div className="space-y-2">
                    <p className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                      Day
                    </p>
                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                      {Array.from({ length: MAX_DAYS }, (_, i) => i + 1).map((day) => (
                        <Button
                          key={day}
                          variant={selectedParticipantDay === day ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleParticipantDaySelection(day)}
                          className="w-full text-xs sm:text-sm"
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Assignments for Selected Participant and Day */}
                  <ScrollArea className="h-[300px] sm:h-[400px]">
                    <div className="space-y-2 pr-4">
                      {FIXED_ASSIGNMENTS.map((assignment) => (
                        <ParticipantAssignmentCard
                          key={assignment.id}
                          assignment={assignment}
                          challengeId={challengeId}
                          participant={selectedParticipant}
                          day={selectedParticipantDay}
                          isRTL={isRTL}
                          playingAssignment={playingAssignment}
                          onPlayRecording={handlePlayRecording}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Coming Soon Tab */}
          <TabsContent value="coming" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">{t('screen6.coming.title')}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">{t('screen6.coming.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t('screen6.coming.message')}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className={`px-4 sm:px-6 pb-6 text-center ${isRTL ? 'text-right' : ''}`}>
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

// Assignment Card Component for My Tab
interface AssignmentCardProps {
  assignment: { id: string; title: string; content: string };
  challengeId: bigint | null;
  day: number;
  isRTL: boolean;
  recordingAssignment: string | null;
  playingAssignment: string | null;
  isRecording: boolean;
  recordingError: string | null;
  audioLevel: number;
  elapsedSeconds: number;
  onStartRecording: (assignmentId: string) => void;
  onStopRecording: () => void;
  onPlayRecording: (blob: ExternalBlob, assignmentId: string) => void;
  onDeleteRecording: (assignmentId: string) => void;
  saveRecordingMutation: any;
  deleteRecordingMutation: any;
}

function AssignmentCard({
  assignment,
  challengeId,
  day,
  isRTL,
  recordingAssignment,
  playingAssignment,
  isRecording,
  recordingError,
  audioLevel,
  elapsedSeconds,
  onStartRecording,
  onStopRecording,
  onPlayRecording,
  onDeleteRecording,
  saveRecordingMutation,
  deleteRecordingMutation,
}: AssignmentCardProps) {
  const { t } = useTranslation();
  
  // Fetch the recording for this assignment
  const recordingQuery = useGetRecording(challengeId, day, assignment.id);
  const hasRecording = !!recordingQuery.data;
  
  const isThisAssignmentRecording = recordingAssignment === assignment.id && isRecording;
  const isThisAssignmentPlaying = playingAssignment === assignment.id;
  const isSaving = saveRecordingMutation.isPending && recordingAssignment === assignment.id;
  const isDeleting = deleteRecordingMutation.isPending;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className={`flex items-center justify-between gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 flex-1 min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle className="text-sm sm:text-base truncate">{assignment.title}</CardTitle>
            {hasRecording && (
              <Badge variant="default" className="flex items-center gap-1 flex-shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-xs hidden sm:inline">Recorded</span>
              </Badge>
            )}
          </div>
          <SharedPopup
            trigger={
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                <Info className={`w-4 h-4 ${isRTL ? 'ml-1 sm:ml-2' : 'mr-1 sm:mr-2'}`} />
                <span className="hidden sm:inline">{t('screen6.my.viewDetails')}</span>
              </Button>
            }
            title={assignment.title}
            description={t('screen6.my.assignmentDescription')}
          >
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {assignment.content}
            </div>
          </SharedPopup>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Recording Feedback - Large, prominent component when recording */}
        {isThisAssignmentRecording && (
          <RecordingFeedback
            audioLevel={audioLevel}
            elapsedSeconds={elapsedSeconds}
            isVisible={isThisAssignmentRecording}
          />
        )}

        {/* Recording Controls */}
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {!isThisAssignmentRecording ? (
            <Button
              onClick={() => onStartRecording(assignment.id)}
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={isRecording || isSaving || hasRecording}
            >
              <Mic className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              <span className="hidden sm:inline">{t('screen6.my.record')}</span>
            </Button>
          ) : (
            <Button
              onClick={onStopRecording}
              size="sm"
              variant="destructive"
              className="flex-1"
            >
              <Square className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              <span className="hidden sm:inline">{t('screen6.my.stopRecording')}</span>
            </Button>
          )}
          <Button
            onClick={() => recordingQuery.data && onPlayRecording(recordingQuery.data, assignment.id)}
            size="sm"
            variant="outline"
            disabled={!hasRecording || isDeleting || isSaving}
          >
            {isThisAssignmentPlaying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={() => onDeleteRecording(assignment.id)}
            size="sm"
            variant="ghost"
            disabled={!hasRecording || isDeleting || isSaving}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Status Messages */}
        {isSaving && (
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving recording...
          </p>
        )}
        {recordingError && isThisAssignmentRecording && (
          <p className="text-xs text-destructive">{sanitizeErrorMessage(recordingError)}</p>
        )}
        {hasRecording && !isThisAssignmentRecording && !isSaving && (
          <p className="text-xs text-muted-foreground">
            You must delete this recording before recording again.
          </p>
        )}
        {!hasRecording && !isThisAssignmentRecording && !isSaving && (
          <p className="text-xs text-muted-foreground">{t('screen6.my.noRecording')}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Participant Assignment Card Component for Team Tab
interface ParticipantAssignmentCardProps {
  assignment: { id: string; title: string; content: string };
  challengeId: bigint | null;
  participant: Principal;
  day: number;
  isRTL: boolean;
  playingAssignment: string | null;
  onPlayRecording: (blob: ExternalBlob, assignmentId: string) => void;
}

function ParticipantAssignmentCard({
  assignment,
  challengeId,
  participant,
  day,
  isRTL,
  playingAssignment,
  onPlayRecording,
}: ParticipantAssignmentCardProps) {
  const { t } = useTranslation();
  
  // Fetch the recording for this participant and assignment
  const recordingQuery = useGetParticipantRecording(challengeId, participant, day, assignment.id);
  const hasRecording = !!recordingQuery.data;
  const isThisAssignmentPlaying = playingAssignment === `${participant.toString()}-${assignment.id}`;

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-md bg-muted/30 ${isRTL ? 'flex-row-reverse' : ''}`}
    >
      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <span className="text-sm font-medium">{assignment.title}</span>
        {hasRecording && (
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
          </Badge>
        )}
      </div>
      <Button
        onClick={() => recordingQuery.data && onPlayRecording(recordingQuery.data, `${participant.toString()}-${assignment.id}`)}
        size="sm"
        variant="ghost"
        disabled={!hasRecording || recordingQuery.isLoading}
      >
        {recordingQuery.isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isThisAssignmentPlaying ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : hasRecording ? (
          <Play className="w-4 h-4" />
        ) : (
          <span className="text-xs text-muted-foreground">{t('screen6.my.noRecording')}</span>
        )}
      </Button>
    </div>
  );
}
