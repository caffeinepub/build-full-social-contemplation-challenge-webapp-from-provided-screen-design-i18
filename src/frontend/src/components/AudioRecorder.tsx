import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Mic, Square, Save, Trash2, Loader2 } from 'lucide-react';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { RecordingLevelMeter } from './RecordingLevelMeter';
import { RecordingPlayer } from './RecordingPlayer';
import { Progress } from './ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import type { CanonicalAssignmentId } from '../utils/recordingIds';

interface AudioRecorderProps {
  assignmentId: CanonicalAssignmentId;
  day: number;
  hasExistingRecording: boolean;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  onUpload: (blob: Blob, shareWithTeam: boolean) => void;
  onDelete: () => void;
  isDeleting: boolean;
  className?: string;
}

export function AudioRecorder({
  assignmentId,
  day,
  hasExistingRecording,
  isUploading,
  uploadProgress,
  uploadError,
  onUpload,
  onDelete,
  isDeleting,
  className = '',
}: AudioRecorderProps) {
  const {
    isRecording,
    recordedBlob,
    recordedUrl,
    error: recordingError,
    level,
    elapsedSeconds,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecording();

  const [localError, setLocalError] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Close share dialog when upload completes or fails
  useEffect(() => {
    if (showShareDialog && !isUploading) {
      // If there's an upload error, close the dialog so user can see the error
      if (uploadError) {
        setShowShareDialog(false);
      }
      // If upload succeeded (no error and not uploading), dialog was already closed by handleShareDecision
    }
  }, [isUploading, uploadError, showShareDialog]);

  const handleStartRecording = async () => {
    setLocalError(null);
    await startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleSaveClick = () => {
    if (!recordedBlob) return;
    setLocalError(null);
    setShowShareDialog(true);
  };

  const handleShareDecision = (shareWithTeam: boolean) => {
    if (!recordedBlob) return;
    setShowShareDialog(false);
    onUpload(recordedBlob, shareWithTeam);
  };

  const handleClearRecording = () => {
    clearRecording();
    setLocalError(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const displayError = recordingError || uploadError || localError;
  const canRecord = !hasExistingRecording && !isRecording && !recordedBlob && !isUploading;
  const canSave = recordedBlob && !isUploading && !hasExistingRecording;

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        {/* Recording State */}
        {isRecording && (
          <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Recording</span>
              </div>
              <span className="text-sm font-mono text-muted-foreground">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            
            <RecordingLevelMeter level={level} />
            
            <Button
              onClick={handleStopRecording}
              size="default"
              variant="destructive"
              className="w-full"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Recording
            </Button>
          </div>
        )}

        {/* Review State */}
        {recordedBlob && recordedUrl && !isRecording && (
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Review Recording</span>
              <span className="text-xs text-muted-foreground">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            
            <RecordingPlayer audioUrl={recordedUrl} />
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSaveClick}
                size="default"
                variant="default"
                className="flex-1"
                disabled={!canSave || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
              <Button
                onClick={handleClearRecording}
                size="default"
                variant="ghost"
                disabled={isUploading}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Saving...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Initial State / Existing Recording State */}
        {!isRecording && !recordedBlob && (
          <div className="space-y-3">
            <Button
              onClick={handleStartRecording}
              size="default"
              variant="default"
              className="w-full"
              disabled={!canRecord || isDeleting}
            >
              <Mic className="w-4 h-4 mr-2" />
              {hasExistingRecording ? 'Recording Saved' : 'Start Recording'}
            </Button>
            
            {hasExistingRecording && (
              <>
                <Button
                  onClick={onDelete}
                  size="default"
                  variant="ghost"
                  className="w-full"
                  disabled={isDeleting || isUploading}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Recording
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Delete the existing recording to record a new one.
                </p>
              </>
            )}
          </div>
        )}

        {/* Error Messages */}
        {displayError && (
          <p className="text-xs text-destructive">{displayError}</p>
        )}
      </div>

      {/* Share Confirmation Dialog - Now with ScrollArea */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-[90vw] w-full sm:max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Share with team?</DialogTitle>
            <DialogDescription>
              Would you like to share this recording with your challenge team?
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Shared recordings will be visible to all participants in your challenge. 
                You can change this setting later if needed.
              </p>
            </div>
          </ScrollArea>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleShareDecision(false)}
              className="w-full sm:w-auto"
              disabled={isUploading}
            >
              No
            </Button>
            <Button
              variant="default"
              onClick={() => handleShareDecision(true)}
              className="w-full sm:w-auto"
              disabled={isUploading}
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
