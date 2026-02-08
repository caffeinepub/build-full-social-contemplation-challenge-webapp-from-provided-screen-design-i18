import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/I18nContext';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { SharedPopup } from '../components/SharedPopup';
import { ScrollArea } from '../components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Settings, Loader2, Users, User, MessageCircle, CheckCircle2, ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { AuthIconButton } from '../components/AuthIconButton';
import { AssignmentDetailText } from '../components/AssignmentDetailText';
import { AudioRecorder } from '../components/AudioRecorder';
import { RecordingPlayer } from '../components/RecordingPlayer';
import { ChallengeChatTab } from '../components/ChallengeChatTab';
import { useGetChallengeStartTime, useGetAssignmentRecordings, useSaveRecording, useDeleteRecording, useShareRecording, useGetAllChallengeParticipantProfiles } from '../hooks/useQueries';
import { formatDayHeader } from '../utils/challengeDayFormat';
import { FIXED_ASSIGNMENTS } from '../utils/assignments';
import { CanonicalAssignmentId } from '../utils/recordingIds';
import { readAppUrlState, writeAppUrlState } from '../utils/appUrlState';
import { sanitizeErrorMessage, isInvalidAssignmentError, isStaleBuildError } from '../utils/sanitizeErrorMessage';
import { tryHardRefresh } from '../utils/hardRefresh';
import { ExternalBlob } from '../backend';

interface Screen6InChallengeProps {
  challengeId: bigint;
  onNavigateToManage: () => void;
  onNavigateBack: () => void;
}

export default function Screen6InChallenge({ challengeId, onNavigateToManage, onNavigateBack }: Screen6InChallengeProps) {
  const { t } = useTranslation();
  
  // URL state management
  const urlState = readAppUrlState();
  const [selectedDay, setSelectedDay] = useState<number>(urlState.day ? parseInt(urlState.day) : 1);
  const [selectedTab, setSelectedTab] = useState<'my' | 'team' | 'chat'>((urlState.tab as 'my' | 'team' | 'chat') ?? 'my');
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(urlState.participant ?? null);
  
  // Sync URL state
  useEffect(() => {
    writeAppUrlState({ 
      day: selectedDay.toString(), 
      tab: selectedTab, 
      participant: selectedParticipant ?? undefined 
    });
  }, [selectedDay, selectedTab, selectedParticipant]);
  
  // Recording state
  const [recordingAssignment, setRecordingAssignment] = useState<CanonicalAssignmentId | null>(null);
  
  // Info popup state
  const [showAssignmentDetail, setShowAssignmentDetail] = useState<CanonicalAssignmentId | null>(null);
  
  // Upload guard to prevent duplicate submissions
  const activeUploadRef = useRef<string | null>(null);
  
  // Stale build error state
  const [staleBuildError, setStaleBuildError] = useState<string | null>(null);
  const [refreshBlocked, setRefreshBlocked] = useState(false);
  
  // Track upload progress
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Queries
  const { data: startTime } = useGetChallengeStartTime(challengeId);
  const { data: participantProfiles } = useGetAllChallengeParticipantProfiles(challengeId);
  
  // Recording queries for each assignment
  const dailyCheckInQuery = useGetAssignmentRecordings(challengeId, selectedDay, 'daily-check-in');
  const morningReflectionQuery = useGetAssignmentRecordings(challengeId, selectedDay, 'morning-reflection');
  const eveningReflectionQuery = useGetAssignmentRecordings(challengeId, selectedDay, 'evening-reflection');
  const mindfulnessPracticeQuery = useGetAssignmentRecordings(challengeId, selectedDay, 'mindfulness-practice');
  const gratitudeJournalQuery = useGetAssignmentRecordings(challengeId, selectedDay, 'gratitude-journal');
  
  // Mutations
  const saveRecordingMutation = useSaveRecording();
  const deleteRecordingMutation = useDeleteRecording();
  const shareRecordingMutation = useShareRecording();
  
  // Get recordings for current user
  const getMyRecording = (assignment: CanonicalAssignmentId) => {
    let query;
    switch (assignment) {
      case 'daily-check-in':
        query = dailyCheckInQuery;
        break;
      case 'morning-reflection':
        query = morningReflectionQuery;
        break;
      case 'evening-reflection':
        query = eveningReflectionQuery;
        break;
      case 'mindfulness-practice':
        query = mindfulnessPracticeQuery;
        break;
      case 'gratitude-journal':
        query = gratitudeJournalQuery;
        break;
      default:
        return null;
    }
    
    if (!query.data) return null;
    
    // Find current user's recording (first entry is always current user)
    const myEntry = query.data[0];
    return myEntry?.[1] ?? null;
  };
  
  // Get team recordings (shared only)
  const getTeamRecordings = (assignment: CanonicalAssignmentId) => {
    let query;
    switch (assignment) {
      case 'daily-check-in':
        query = dailyCheckInQuery;
        break;
      case 'morning-reflection':
        query = morningReflectionQuery;
        break;
      case 'evening-reflection':
        query = eveningReflectionQuery;
        break;
      case 'mindfulness-practice':
        query = mindfulnessPracticeQuery;
        break;
      case 'gratitude-journal':
        query = gratitudeJournalQuery;
        break;
      default:
        return [];
    }
    
    if (!query.data) return [];
    
    // Filter to only shared recordings (skip first entry which is current user)
    return query.data.slice(1).filter(([_, recording]) => recording?.isShared);
  };
  
  // Handle save recording
  const handleSaveRecording = async (assignment: CanonicalAssignmentId, blob: Blob, shouldShare: boolean) => {
    // Guard against duplicate uploads
    const uploadKey = `${challengeId}-${selectedDay}-${assignment}`;
    if (activeUploadRef.current === uploadKey) {
      console.warn('[Screen6] Upload already in progress, ignoring duplicate');
      return;
    }
    
    activeUploadRef.current = uploadKey;
    setStaleBuildError(null);
    setRefreshBlocked(false);
    setUploadProgress(0);
    
    try {
      // Convert Blob to Uint8Array
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Create ExternalBlob with progress tracking
      const externalBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });
      
      await saveRecordingMutation.mutateAsync({
        challengeId,
        day: selectedDay,
        assignment,
        recording: externalBlob,
      });
      
      // If save succeeded, update share status if needed
      if (shouldShare) {
        await shareRecordingMutation.mutateAsync({
          challengeId,
          day: selectedDay,
          assignment,
          isShared: true,
        });
      }
      
      setRecordingAssignment(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('[Screen6] Save recording error:', error);
      
      // Check if this is a stale build error
      if (isInvalidAssignmentError(error) || isStaleBuildError(error)) {
        const userMessage = sanitizeErrorMessage(error);
        setStaleBuildError(userMessage);
        
        // Attempt cache-busted refresh
        const refreshInitiated = tryHardRefresh('invalid-assignment');
        
        if (!refreshInitiated) {
          // Refresh was blocked by loop protection
          setRefreshBlocked(true);
        }
      }
      
      throw error;
    } finally {
      activeUploadRef.current = null;
    }
  };
  
  // Handle delete recording
  const handleDeleteRecording = async (assignment: CanonicalAssignmentId) => {
    try {
      await deleteRecordingMutation.mutateAsync({
        challengeId,
        day: selectedDay,
        assignment,
      });
    } catch (error) {
      console.error('[Screen6] Delete recording error:', error);
      throw error;
    }
  };
  
  // Handle share toggle
  const handleShareToggle = async (assignment: CanonicalAssignmentId, isShared: boolean) => {
    try {
      await shareRecordingMutation.mutateAsync({
        challengeId,
        day: selectedDay,
        assignment,
        isShared,
      });
    } catch (error) {
      console.error('[Screen6] Share toggle error:', error);
      throw error;
    }
  };
  
  // Day header
  const dayHeader = formatDayHeader(startTime ?? null, selectedDay);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNavigateBack}
            aria-label="Back to menu"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <h1 className="text-lg font-semibold">{t('screen6.title')}</h1>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AuthIconButton />
            <Button
              variant="ghost"
              size="icon"
              onClick={onNavigateToManage}
              aria-label="Manage challenge"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Subtitle */}
        <p className="text-center text-muted-foreground text-sm">
          {t('screen6.subtitle')}
        </p>
        
        {/* Day selector */}
        <div className="space-y-2">
          <h2 className="text-center font-medium">{dayHeader}</h2>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <Button
                key={day}
                variant={selectedDay === day ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDay(day)}
                className="w-12 h-12 rounded-full"
              >
                {day}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'my' | 'team' | 'chat')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my">
              <User className="h-4 w-4 mr-2" />
              {t('screen6.tabs.my')}
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              {t('screen6.tabs.team')}
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageCircle className="h-4 w-4 mr-2" />
              {t('screen6.tabs.chat')}
            </TabsTrigger>
          </TabsList>
          
          {/* My Tab */}
          <TabsContent value="my" className="space-y-4 mt-6">
            {FIXED_ASSIGNMENTS.map((assignment) => {
              const myRecording = getMyRecording(assignment.id);
              const isRecording = recordingAssignment === assignment.id;
              
              return (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        {myRecording && (
                          <Badge variant="outline" className="mt-2">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Recorded
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAssignmentDetail(assignment.id)}
                      >
                        Details
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Recording UI */}
                    {isRecording ? (
                      <div className="space-y-4">
                        <AudioRecorder
                          assignmentId={assignment.id}
                          day={selectedDay}
                          hasExistingRecording={!!myRecording}
                          isUploading={saveRecordingMutation.isPending}
                          uploadProgress={uploadProgress}
                          uploadError={saveRecordingMutation.error ? sanitizeErrorMessage(saveRecordingMutation.error) : null}
                          onUpload={(blob, shouldShare) => handleSaveRecording(assignment.id, blob, shouldShare)}
                          onDelete={() => setRecordingAssignment(null)}
                          isDeleting={false}
                        />
                        
                        {/* Stale build error message */}
                        {staleBuildError && (
                          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 space-y-3">
                            <p className="text-sm text-destructive font-medium">
                              {staleBuildError}
                            </p>
                            {refreshBlocked && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.reload()}
                                className="w-full"
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh Page Manually
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : myRecording ? (
                      <div className="space-y-3">
                        <RecordingPlayer
                          audioUrl={myRecording.value.getDirectURL()}
                        />
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-muted-foreground">
                              Share with team
                            </label>
                            <input
                              type="checkbox"
                              checked={myRecording.isShared}
                              onChange={(e) => handleShareToggle(assignment.id, e.target.checked)}
                              disabled={shareRecordingMutation.isPending}
                              className="h-4 w-4"
                            />
                          </div>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteRecording(assignment.id)}
                            disabled={deleteRecordingMutation.isPending}
                          >
                            {deleteRecordingMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setRecordingAssignment(assignment.id)}
                        className="w-full"
                      >
                        Start Recording
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
          
          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4 mt-6">
            {FIXED_ASSIGNMENTS.map((assignment) => {
              const teamRecordings = getTeamRecordings(assignment.id);
              
              return (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAssignmentDetail(assignment.id)}
                      >
                        Details
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {teamRecordings.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No shared recordings yet
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {teamRecordings.map(([principal, recording]) => {
                          if (!recording) return null;
                          
                          const profile = participantProfiles?.find(([p]) => p.toString() === principal.toString())?.[1];
                          const name = profile?.name ?? 'Unknown';
                          
                          return (
                            <div key={principal.toString()} className="space-y-2">
                              <p className="text-sm font-medium">{name}</p>
                              <RecordingPlayer
                                audioUrl={recording.value.getDirectURL()}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
          
          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-6">
            <ChallengeChatTab challengeId={challengeId} isActive={selectedTab === 'chat'} />
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Assignment detail popup */}
      {showAssignmentDetail && (
        <SharedPopup
          trigger={<></>}
          open={!!showAssignmentDetail}
          onOpenChange={(open) => !open && setShowAssignmentDetail(null)}
          title={FIXED_ASSIGNMENTS.find((a) => a.id === showAssignmentDetail)?.title ?? ''}
        >
          <AssignmentDetailText
            content={FIXED_ASSIGNMENTS.find((a) => a.id === showAssignmentDetail)?.content ?? ''}
          />
        </SharedPopup>
      )}
    </div>
  );
}
