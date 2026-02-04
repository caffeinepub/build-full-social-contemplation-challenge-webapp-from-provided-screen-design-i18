import { useEffect, useState } from 'react';
import { useTranslation } from '../i18n/I18nContext';
import { Card } from './ui/card';
import { Mic } from 'lucide-react';

interface RecordingFeedbackProps {
  audioLevel: number;
  elapsedSeconds: number;
  isVisible: boolean;
}

export function RecordingFeedback({ audioLevel, elapsedSeconds, isVisible }: RecordingFeedbackProps) {
  const { t, direction } = useTranslation();
  const isRTL = direction === 'rtl';
  const [pulseScale, setPulseScale] = useState(1);

  // Format elapsed time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Create subtle pulse effect based on audio level
  useEffect(() => {
    if (isVisible && audioLevel > 0.1) {
      setPulseScale(1 + audioLevel * 0.15);
    } else {
      setPulseScale(1);
    }
  }, [audioLevel, isVisible]);

  if (!isVisible) return null;

  return (
    <Card className="p-6 bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent border-destructive/20 shadow-lg">
      <div className="space-y-6">
        {/* REC Indicator and Timer */}
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div 
              className="relative flex items-center justify-center"
              style={{ transform: `scale(${pulseScale})`, transition: 'transform 0.1s ease-out' }}
            >
              <div className="absolute w-12 h-12 bg-destructive/20 rounded-full animate-ping" />
              <div className="relative w-12 h-12 bg-destructive rounded-full flex items-center justify-center">
                <Mic className="w-6 h-6 text-destructive-foreground" />
              </div>
            </div>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                <span className="text-sm font-bold text-destructive uppercase tracking-wider">
                  {t('screen6.recording.recLabel')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('screen6.recording.inProgress')}
              </p>
            </div>
          </div>
          <div className="text-2xl font-mono font-bold tabular-nums">
            {formatTime(elapsedSeconds)}
          </div>
        </div>

        {/* Live Audio Level Meter */}
        <div className="space-y-2">
          <div className={`flex items-center justify-between text-xs text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span>{t('screen6.recording.levelLabel')}</span>
            <span>{Math.round(audioLevel * 100)}%</span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary to-primary/80 rounded-full transition-all duration-100 ease-out"
              style={{ 
                width: `${audioLevel * 100}%`,
                boxShadow: audioLevel > 0.1 ? '0 0 8px rgba(var(--primary), 0.5)' : 'none'
              }}
            />
          </div>
        </div>

        {/* Reassuring Message */}
        <p className={`text-sm text-center text-muted-foreground italic ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('screen6.recording.reassurance')}
        </p>
      </div>
    </Card>
  );
}
