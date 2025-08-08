import { Button } from "@/components/ui/button";
import { Play, Pause, Trash2, SkipForward, RotateCcw } from "lucide-react";
import type { Task } from "@shared/schema";

interface ActiveTaskItemProps {
  task: Task;
  isActive: boolean;
  onPlay: () => void;
  onPause: () => void;
  onDelete: (id: number) => void;
  onSkip: () => void;
  onReset: () => void;
  isRunning: boolean;
  isDeleting: boolean;
}

export function ActiveTaskItem({ 
  task, 
  isActive, 
  onPlay, 
  onPause, 
  onDelete, 
  onSkip, 
  onReset, 
  isRunning, 
  isDeleting 
}: ActiveTaskItemProps) {
  return (
    <div 
      className={`flex items-center p-4 transition-all duration-200 shadow-md ${
        isActive 
          ? 'bg-blue-50 border-2 border-indigo-500' 
          : 'bg-white border border-gray-200'
      }`}
      style={{ borderRadius: '0.5rem' }}
    >
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm ${
          isActive ? 'text-gray-900' : 'text-gray-900'
        }`}>
          {task.isInterval ? 'Break' : task.name}
        </div>
        <div className={`text-xs ${
          isActive ? 'text-gray-600' : 'text-gray-600'
        }`}>
          {task.duration} minutes
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-3">
        {isActive && (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={isRunning ? onPause : onPlay}
              className="p-2 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 border border-gray-300"
              style={{ borderRadius: '0.5rem' }}
            >
              {isRunning ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onSkip}
              className="p-2 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 border border-gray-300"
              style={{ borderRadius: '0.5rem' }}
              title="Skip current task"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onReset}
              className="p-2 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 border border-gray-300"
              style={{ borderRadius: '0.5rem' }}
              title="Reset current task"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </>
        )}
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(task.id)}
          disabled={isDeleting}
          className="p-2 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 border border-gray-300"
          style={{ borderRadius: '0.5rem' }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}