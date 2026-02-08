import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/I18nContext';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { SharedPopup } from '../components/SharedPopup';
import { ScrollArea } from '../components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Settings, Play, Loader2, Users, User, MessageCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { AuthIconButton } from '../components/AuthIconButton';
import { AssignmentDetailText } from '../components/AssignmentDetailText';
import { AudioRecorder } from '../components/AudioRecorder';
import { RecordingPlayer } from '../components/RecordingPlayer';
import { 
  useGetUnifiedChallengeId,
  useGetAllChallengeParticipantProfiles,
  useSaveRecording,
  useGetRecording,
  useDeleteRecording,
  useShareRecording,
  useGetAssignmentRecordings,
  useGetChallengeStartTime
} from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import type { Recording } from '../backend';
import { FIXED_ASSIGNMENTS, clampDay } from '../utils/assignments';
import type { CanonicalAssignmentId } from '../utils/recordingIds';
import { assertCanonicalAssignmentId } from '../utils/recordingIds';
import { sanitizeErrorMessage, isChallengeNotFoundError } from '../utils/sanitizeErrorMessage';
import { formatDayHeader } from '../utils/challengeDayFormat';
import { readAppUrlState, writeAppUrlState } from '../utils/appUrlState';
import { ChallengeChatTab } from '../components/ChallengeChatTab';
import { useQueryClient } from '@tanstack/react-query';
import { resetChallengeState } from '../utils/challengeRecovery';
import { setChallengeDeletedNotice } from '../utils/challengeDeletedNotice';
import type { Principal } from '@icp-sdk/core/principal';

interface Screen6InChallengeProps {
  onNavigateToManage?: () => void;
  onNavigateBack?: () => void;
}

// Maximum days for the 7-day challenge
const MAX_DAYS = 7;

interface UploadState {
  progress: number;
  error: string | null;
  isUploading: boolean;
}

export function Screen6InChallenge({ onNavigateToManage, onNavigateBack }: Screen6InChallengeProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // Initialize state from URL
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('my');
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedParticipant, setSelectedParticipant] = useState<Principal | null>(null);
  const [selectedParticipantDay, setSelectedParticipantDay] = useState(1);
  
  // Track upload state per assignment (keyed by canonical ID)
  const [uploadStates, setUploadStates] = useState<Partial<Record<CanonicalAssignmentId, UploadState>>>({});
  
  // Track active uploads to prevent duplicates
  const activeUploadsRef = useRef<Set<string>>(new Set());
  
  // Track which assignment audio is currently playing
  const [playingAssignment, setPlayingAssignment] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get challenge ID using unified resolver
  const { challengeId } = useGetUnifiedChallengeId();

  // Fetch challenge start time
  const startTimeQuery = useGetChallengeStartTime(challengeId);

  // Fetch participant profiles
  const participantProfilesQuery = useGetAllChallengeParticipantProfiles(challengeId);

  // Mutations
  const saveRecordingMutation = useSaveRecording();
  const shareRecordingMutation = useShareRecording();
  const deleteRecordingMutation = useDeleteRecording();

  // Detect "Challenge not found" errors and trigger recovery
  useEffect(() => {
    const errors = [
      startTimeQuery.error,
      participantProfilesQuery.error,
    ];

    for (const error of errors) {
      if (error && isChallengeNotFoundError(error)) {
        console.warn('Challenge not found in Screen6 - triggering recovery');
        resetChallengeState(queryClient);
        setChallengeDeletedNotice();
        if (onNavigateBack) {
          onNavigateBack();
        }
        break;
      }
    }
  }, [
    startTimeQuery.error,
    participantProfilesQuery.error,
    queryClient,
    onNavigateBack,
  ]);

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
          const principal = urlState.participant;
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

  // Recording upload handler - accepts canonical assignment ID and share decision
  const handleRecordingUpload = async (assignmentId: CanonicalAssignmentId, blob: Blob, shareWithTeam: boolean) => {
    if (!challengeId) return;

    // Create unique key for this upload
    const uploadKey = `${challengeId}-${selectedDay}-${assignmentId}`;
    
    // Defensive guard: prevent duplicate uploads
    if (activeUploadsRef.current.has(uploadKey)) {
      console.warn('Upload already in progress for', uploadKey);
      return;
    }

    // Development-time assertion: ensure assignment is canonical before upload
    try {
      assertCanonicalAssignmentId(assignmentId, 'handleRecordingUpload');
    } catch (error) {
      console.error(error);
      setUploadStates(prev => ({
        ...prev,
        [assignmentId]: {
          progress: 0,
          error: 'Development error: Invalid assignment ID. Please refresh and try again.',
          isUploading: false,
        }
      }));
      return;
    }

    // Mark upload as active
    activeUploadsRef.current.add(uploadKey);

    // Initialize upload state
    setUploadStates(prev => ({
      ...prev,
      [assignmentId]: {
        progress: 0,
        error: null,
        isUploading: true,
      }
    }));

    try {
      // Convert blob to bytes
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Create ExternalBlob with progress tracking
      const externalBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
        setUploadStates(prev => ({
          ...prev,
          [assignmentId]: {
            ...prev[assignmentId]!,
            progress: percentage,
          }
        }));
      });

      // Save recording - pass UI day (1-7) and canonical assignment ID
      await saveRecordingMutation.mutateAsync({
        challengeId,
        day: selectedDay,
        assignment: assignmentId,
        recording: externalBlob,
      });

      // Share recording based on user's decision
      await shareRecordingMutation.mutateAsync({
        challengeId,
        day: selectedDay,
        assignment: assignmentId,
        isShared: shareWithTeam,
      });

      // Clear upload state on success
      setUploadStates(prev => {
        const newState = { ...prev };
        delete newState[assignmentId];
        return newState;
      });
      
      // Remove from active uploads
      activeUploadsRef.current.delete(uploadKey);
    } catch (error) {
      console.error('Failed to upload recording:', error);
      
      // Remove from active uploads
      activeUploadsRef.current.delete(uploadKey);
      
      // Check if challenge was deleted
      if (isChallengeNotFoundError(error)) {
        resetChallengeState(queryClient);
        setChallengeDeletedNotice();
        if (onNavigateBack) {
          onNavigateBack();
        }
        return;
      }
      
      setUploadStates(prev => ({
        ...prev,
        [assignmentId]: {
          progress: 0,
          error: sanitizeErrorMessage(error),
          isUploading: false,
        }
      }));
    }
  };

  const handleDeleteRecording = async (assignmentId: CanonicalAssignmentId) => {
    if (!challengeId) return;
    
    // Development-time assertion: ensure assignment is canonical before delete
    try {
      assertCanonicalAssignmentId(assignmentId, 'handleDeleteRecording');
    } catch (error) {
      console.error(error);
      setUploadStates(prev => ({
        ...prev,
        [assignmentId]: {
          progress: 0,
          error: 'Development error: Invalid assignment ID. Please refresh and try again.',
          isUploading: false,
        }
      }));
      return;
    }
    
    try {
      await deleteRecordingMutation.mutateAsync({
        challengeId,
        day: selectedDay,
        assignment: assignmentId,
      });
      
      // Clear any upload state for this assignment
      setUploadStates(prev => {
        const newState = { ...prev };
        delete newState[assignmentId];
        return newState;
      });

      // Stop playback if this recording was playing
      if (playingAssignment === assignmentId) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setPlayingAssignment(null);
      }
    } catch (error) {
      console.error('Failed to delete recording:', error);
      
      // Check if challenge was deleted
      if (isChallengeNotFoundError(error)) {
        resetChallengeState(queryClient);
        setChallengeDeletedNotice();
        if (onNavigateBack) {
          onNavigateBack();
        }
        return;
      }
      
      // Show error in upload state
      setUploadStates(prev => ({
        ...prev,
        [assignmentId]: {
          progress: 0,
          error: sanitizeErrorMessage(error),
          isUploading: false,
        }
      }));
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
        <div className="flex items-center gap-3 mb-4">
          {onNavigateBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNavigateBack}
              className="flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex-1">
            {t('screen6.title')}
          </h1>
          <ThemeToggle />
          <AuthIconButton />
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
        <p className="text-sm text-muted-foreground text-center">
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
            <TabsTrigger value="chat" aria-label="Chat">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="sr-only">Chat</span>
            </TabsTrigger>
          </TabsList>

          {/* My Tab */}
          <TabsContent value="my" className="space-y-4 mt-6">
            {/* Day Header with weekday and date */}
            <div className="text-center">
              <h2 className="text-base sm:text-lg font-semibold">{dayHeader}</h2>
            </div>

            {/* Day Selector */}
            <div className="space-y-2">
              <p className="text-sm font-medium">
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
                  playingAssignment={playingAssignment}
                  uploadState={uploadStates[assignment.id]}
                  onRecordingUpload={handleRecordingUpload}
                  onPlayRecording={handlePlayRecording}
                  onDeleteRecording={handleDeleteRecording}
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
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
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
                        }`}
                        onClick={() => setSelectedParticipant(principal)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {profile?.name?.trim() ? profile.name.charAt(0).toUpperCase() : '?'}
                            </span>
                          </div>
                          <span className="text-sm font-medium">
                            {profile?.name?.trim() || 'Unknown'}
                          </span>
                        </div>
                        {selectedParticipant?.toString() === principal.toString() && (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected Participant's Recordings */}
            {selectedParticipant && (
              <>
                {/* Day Header */}
                <div className="text-center">
                  <h2 className="text-base sm:text-lg font-semibold">{participantDayHeader}</h2>
                </div>

                {/* Day Selector */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">
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

                {/* Participant's Assignments */}
                <div className="space-y-3">
                  {FIXED_ASSIGNMENTS.map((assignment) => (
                    <ParticipantAssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      challengeId={challengeId}
                      participant={selectedParticipant}
                      day={selectedParticipantDay}
                      playingAssignment={playingAssignment}
                      onPlayRecording={handlePlayRecording}
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-6">
            <ChallengeChatTab challengeId={challengeId} isActive={activeTab === 'chat'} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Assignment Card Component for My Tab
interface AssignmentCardProps {
  assignment: typeof FIXED_ASSIGNMENTS[number];
  challengeId: bigint | null;
  day: number;
  playingAssignment: string | null;
  uploadState?: UploadState;
  onRecordingUpload: (assignmentId: CanonicalAssignmentId, blob: Blob, shareWithTeam: boolean) => void;
  onPlayRecording: (blob: ExternalBlob, assignmentId: string) => void;
  onDeleteRecording: (assignmentId: CanonicalAssignmentId) => void;
  deleteRecordingMutation: ReturnType<typeof useDeleteRecording>;
}

function AssignmentCard({
  assignment,
  challengeId,
  day,
  playingAssignment,
  uploadState,
  onRecordingUpload,
  onPlayRecording,
  onDeleteRecording,
  deleteRecordingMutation,
}: AssignmentCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Fetch recording for this assignment
  const recordingQuery = useGetRecording(challengeId, day, assignment.id);
  
  const hasRecording = !!recordingQuery.data;
  const isPlaying = playingAssignment === assignment.id;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-sm sm:text-base">{assignment.title}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="flex-shrink-0"
          >
            {showDetails ? 'Hide' : 'Details'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showDetails && (
          <div className="p-3 bg-muted/30 rounded-md">
            <AssignmentDetailText content={assignment.content} />
          </div>
        )}

        {/* Recording Controls */}
        {hasRecording && recordingQuery.data ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPlayRecording(recordingQuery.data, assignment.id)}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-2" />
                {isPlaying ? 'Playing...' : 'Play Recording'}
              </Button>
            </div>
            <RecordingPlayer audioUrl={recordingQuery.data.getDirectURL()} />
          </div>
        ) : null}

        {/* Audio Recorder */}
        <AudioRecorder
          assignmentId={assignment.id}
          day={day}
          hasExistingRecording={hasRecording}
          isUploading={uploadState?.isUploading || false}
          uploadProgress={uploadState?.progress || 0}
          uploadError={uploadState?.error || null}
          onUpload={(blob, shareWithTeam) => onRecordingUpload(assignment.id, blob, shareWithTeam)}
          onDelete={() => onDeleteRecording(assignment.id)}
          isDeleting={deleteRecordingMutation.isPending}
        />
      </CardContent>
    </Card>
  );
}

// Participant Assignment Card Component for Team Tab
interface ParticipantAssignmentCardProps {
  assignment: typeof FIXED_ASSIGNMENTS[number];
  challengeId: bigint | null;
  participant: Principal;
  day: number;
  playingAssignment: string | null;
  onPlayRecording: (blob: ExternalBlob, assignmentId: string) => void;
}

function ParticipantAssignmentCard({
  assignment,
  challengeId,
  participant,
  day,
  playingAssignment,
  onPlayRecording,
}: ParticipantAssignmentCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Fetch all recordings for this assignment/day
  const recordingsQuery = useGetAssignmentRecordings(challengeId, day, assignment.id);
  
  // Find this participant's recording
  const participantRecording = recordingsQuery.data?.find(
    ([p]) => p.toString() === participant.toString()
  )?.[1];
  
  // Only show if recording exists and is shared
  const hasSharedRecording = participantRecording && participantRecording.isShared;
  const isPlaying = playingAssignment === `${participant.toString()}-${assignment.id}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-sm sm:text-base">{assignment.title}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="flex-shrink-0"
          >
            {showDetails ? 'Hide' : 'Details'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showDetails && (
          <div className="p-3 bg-muted/30 rounded-md">
            <AssignmentDetailText content={assignment.content} />
          </div>
        )}

        {/* Recording Controls */}
        {hasSharedRecording ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPlayRecording(participantRecording.value, `${participant.toString()}-${assignment.id}`)}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-2" />
                {isPlaying ? 'Playing...' : 'Play Recording'}
              </Button>
            </div>
            <RecordingPlayer audioUrl={participantRecording.value.getDirectURL()} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">
            No shared recording yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
