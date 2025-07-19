import type { Task } from "@shared/schema";

interface TimerDisplayProps {
  timeRemaining: number;
  progress: number;
  currentTask?: Task;
}

export function TimerDisplay({ timeRemaining, progress, currentTask }: TimerDisplayProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const circumference = 283;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto mb-6">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="#E5E5EA"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="#007AFF"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-2xl sm:text-4xl font-bold text-gray-900">
            {formatTime(timeRemaining)}
          </div>
          <div className="text-xs sm:text-sm text-ios-secondary mt-1 max-w-[120px] sm:max-w-[140px] mx-auto break-words leading-tight">
            {currentTask ? (currentTask.isInterval ? 'Break' : currentTask.name) : 'No task selected'}
          </div>
        </div>
      </div>
    </div>
  );
}
