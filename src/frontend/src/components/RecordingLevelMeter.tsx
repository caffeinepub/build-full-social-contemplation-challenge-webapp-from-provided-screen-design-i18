import React from 'react';

interface RecordingLevelMeterProps {
  level: number; // 0-1 normalized
  className?: string;
}

export function RecordingLevelMeter({ level, className = '' }: RecordingLevelMeterProps) {
  const percentage = Math.round(level * 100);
  
  // Color based on level
  const getColor = () => {
    if (level < 0.3) return 'bg-green-500';
    if (level < 0.7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Level</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-100 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
