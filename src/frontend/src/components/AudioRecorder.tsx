import React, { useState } from 'react';
import { Button } from './ui/button';
import { Mic, Square, Upload, Trash2, Loader2 } from 'lucide-react';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { RecordingLevelMeter } from './RecordingLevelMeter';
import { RecordingPlayer } from './RecordingPlayer';
import { Progress } from './ui/progress';
import type { CanonicalAssignmentId } from '../utils/recordingIds';

interface AudioRecorderProps {
  assignmentId: CanonicalAssignmentId;
  day: number;
  hasExistingRecording: boolean;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  onUpload: (blob: Blob) => void;
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

  const handleStartRecording = async () => {
    setLocalError(null);
    await startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleUpload = () => {
    if (!recordedBlob) return;
    setLocalError(null);
    onUpload(recordedBlob);
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
  const canUpload = recordedBlob && !isUploading && !hasExistingRecording;

  return (
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
              onClick={handleUpload}
              size="default"
              variant="default"
              className="flex-1"
              disabled={!canUpload || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
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
            <span>Uploading...</span>
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
  );
}
