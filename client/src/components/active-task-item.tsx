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
          ? 'bg-white/20 border-white/30 shadow-sm' 
          : 'bg-white/10 border-white/20'
      }`}
      style={{ borderRadius: '0.5rem' }}
    >
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm ${
          isActive ? 'text-white' : 'text-white/90'
        }`}>
          {task.isInterval ? 'Break' : task.name}
        </div>
        <div className={`text-xs ${
          isActive ? 'text-white/80' : 'text-white/70'
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
            className="p-2 bg-white/20 text-white hover:bg-white/30 active:bg-white/40 border border-white/30"
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
          className="p-2 bg-white/20 text-white hover:bg-white/30 active:bg-white/40 border border-white/30"
          style={{ borderRadius: '0.5rem' }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}