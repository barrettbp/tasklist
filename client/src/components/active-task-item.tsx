import { Button } from "@/components/ui/button";
import { Play, Pause, Trash2 } from "lucide-react";
import type { Task } from "@shared/schema";

interface ActiveTaskItemProps {
  task: Task;
  isActive: boolean;
  onPlay: () => void;
  onPause: () => void;
  onDelete: (id: number) => void;
  isRunning: boolean;
  isDeleting: boolean;
}

export function ActiveTaskItem({ 
  task, 
  isActive, 
  onPlay, 
  onPause, 
  onDelete, 
  isRunning, 
  isDeleting 
}: ActiveTaskItemProps) {
  return (
    <div 
      className={`flex items-center p-4 border transition-all duration-200 ${
        isActive 
          ? 'bg-blue-50 border-blue-200 shadow-sm' 
          : 'bg-gray-50 border-gray-100'
      }`}
      style={{ borderRadius: '0.5rem' }}
    >
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm ${
          isActive ? 'text-blue-900' : 'text-gray-700'
        }`}>
          {task.isInterval ? 'Break' : task.name}
        </div>
        <div className={`text-xs ${
          isActive ? 'text-blue-600' : 'text-gray-500'
        }`}>
          {task.duration} minutes
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-3">
        {isActive && (
          <Button
            size="sm"
            variant="ghost"
            onClick={isRunning ? onPause : onPlay}
            className={`p-2 bg-[#4F46E5] text-white hover:bg-indigo-700 active:bg-purple-700 ${
              isRunning 
                ? '' 
                : ''
            }`}
            style={{ borderRadius: '0.5rem' }}
          >
            {isRunning ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        )}
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(task.id)}
          disabled={isDeleting}
          className="p-2 bg-[#4F46E5] text-white hover:bg-indigo-700 active:bg-purple-700"
          style={{ borderRadius: '0.5rem' }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}