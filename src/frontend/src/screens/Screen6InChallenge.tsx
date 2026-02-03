import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/I18nContext';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Settings, Mic, Play, Trash2, Loader2, Users, Info, Square } from 'lucide-react';
import { 
  useGetActiveChallengeIdForCreator, 
  useGetAllChallengeParticipantProfiles,
  useSaveRecording,
  useGetRecording,
  useDeleteRecording,
  useGetParticipantRecording
} from '../hooks/useQueries';
import { getPersistedActiveChallengeId } from '../utils/challengeContext';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { ExternalBlob } from '../backend';
import { FIXED_ASSIGNMENTS, clampDay } from '../utils/assignments';
import { sanitizeErrorMessage } from '../utils/sanitizeErrorMessage';
import type { Principal } from '@icp-sdk/core/principal';

interface Screen6InChallengeProps {
  onNavigateToManage?: () => void;
}

// Maximum days for the 7-day challenge
const MAX_DAYS = 7;

export function Screen6InChallenge({ onNavigateToManage }: Screen6InChallengeProps) {
  const { t, direction } = useTranslation();
  const isRTL = direction === 'rtl';
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedParticipant, setSelectedParticipant] = useState<Principal | null>(null);
  const [selectedParticipantDay, setSelectedParticipantDay] = useState(1);
  
  // Track which assignment is currently being recorded
  const [recordingAssignment, setRecordingAssignment] = useState<string | null>(null);
  
  // Track which assignment audio is currently playing
  const [playingAssignment, setPlayingAssignment] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get challenge ID
  const activeChallengeQuery = useGetActiveChallengeIdForCreator();
  const persistedChallengeId = getPersistedActiveChallengeId();
  const challengeId = activeChallengeQuery.data ?? persistedChallengeId;

  // Fetch participant profiles
  const participantProfilesQuery = useGetAllChallengeParticipantProfiles(challengeId ?? null);

  // Audio recording hook
  const { startRecording, stopRecording, clearRecording, recordedBlob, isRecording, error: recordingError } = useAudioRecording();

  // Mutations
  const saveRecordingMutation = useSaveRecording();
  const deleteRecordingMutation = useDeleteRecording();

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

  return (
    <div className="flex flex-col min-h-[600px]">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent px-6 pt-12 pb-8">
        <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h1 className={`text-2xl font-bold tracking-tight ${isRTL ? 'text-right' : 'text-left'} flex-1`}>
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
      <div className="flex-1 px-6 py-8">
        <Tabs defaultValue="my" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my">{t('screen6.tabs.my')}</TabsTrigger>
            <TabsTrigger value="team">{t('screen6.tabs.team')}</TabsTrigger>
            <TabsTrigger value="coming">{t('screen6.tabs.coming')}</TabsTrigger>
          </TabsList>

          {/* My Tab */}
          <TabsContent value="my" className="space-y-4 mt-6">
            {/* Day Selector - Separate label with numeric-only buttons */}
            <div className="space-y-2">
              <p className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                Day
              </p>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: MAX_DAYS }, (_, i) => i + 1).map((day) => (
                  <Button
                    key={day}
                    variant={selectedDay === day ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDaySelection(day)}
                    className="w-full"
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
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Users className="w-5 h-5" />
                  {t('screen6.team.participants')}
                </CardTitle>
                <CardDescription>{t('screen6.team.participantsDescription')}</CardDescription>
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
                  <CardTitle>{t('screen6.team.recordings')}</CardTitle>
                  <CardDescription>{t('screen6.team.recordingsDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Day Selector for Team - Separate label with numeric-only buttons */}
                  <div className="space-y-2">
                    <p className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                      Day
                    </p>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: MAX_DAYS }, (_, i) => i + 1).map((day) => (
                        <Button
                          key={day}
                          variant={selectedParticipantDay === day ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleParticipantDaySelection(day)}
                          className="w-full"
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Assignments for Selected Participant and Day */}
                  <ScrollArea className="h-[400px]">
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
                <CardTitle>{t('screen6.coming.title')}</CardTitle>
                <CardDescription>{t('screen6.coming.description')}</CardDescription>
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
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <CardTitle className="text-base">{assignment.title}</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Info className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('screen6.my.viewDetails')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{assignment.title}</DialogTitle>
                <DialogDescription>{t('screen6.my.assignmentDescription')}</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[500px] pr-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {assignment.content}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Recording Controls */}
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {!isThisAssignmentRecording ? (
            <Button
              onClick={() => onStartRecording(assignment.id)}
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={isRecording || isSaving}
            >
              <Mic className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('screen6.my.record')}
            </Button>
          ) : (
            <Button
              onClick={onStopRecording}
              size="sm"
              variant="destructive"
              className="flex-1"
            >
              <Square className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('screen6.my.stopRecording')}
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
      <span className="text-sm font-medium">{assignment.title}</span>
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
