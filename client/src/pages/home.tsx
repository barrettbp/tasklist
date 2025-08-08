import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { AddTaskModal } from "@/components/add-task-modal";
import { ActiveTaskItem } from "@/components/active-task-item";
import { NotificationManager } from "@/components/NotificationManager";
import { sessionStorage } from "@/utils/sessionStorage";
import type { Task, InsertTask } from "@shared/schema";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [isPushNotificationEnabled, setIsPushNotificationEnabled] = useState(false);
  const [hasStartedTimer, setHasStartedTimer] = useState(false);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Fetch tasks with session storage fallback
  const { data: serverTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Use session storage as backup when server is unavailable
  const [cachedTasks, setCachedTasks] = useState<Task[]>([]);
  const [reorderedTasks, setReorderedTasks] = useState<Task[] | null>(null);
  
  // Use reordered tasks first, then server tasks, then cached tasks
  const tasks = reorderedTasks || (serverTasks.length > 0 ? serverTasks : cachedTasks);
  
  // Load cached tasks on mount
  useEffect(() => {
    const cached = sessionStorage.loadTasks();
    setCachedTasks(cached);
  }, []);
  
  // Save tasks to session storage whenever server tasks change (but not reordered ones)
  useEffect(() => {
    if (serverTasks.length > 0) {
      sessionStorage.saveTasks(serverTasks);
      // Clear reordered tasks when we get fresh server data
      if (reorderedTasks && JSON.stringify(serverTasks) === JSON.stringify(reorderedTasks)) {
        setReorderedTasks(null);
      }
    }
  }, [serverTasks, reorderedTasks]);
  
  // Load and restore timer state on mount
  useEffect(() => {
    const savedState = sessionStorage.loadTimerState();
    if (savedState && tasks.length > 0) {
      setCurrentTaskIndex(savedState.currentTaskIndex || 0);
      setTimeRemaining(savedState.timeRemaining || 0);
      setHasStartedTimer(savedState.hasStartedTimer || false);
      setCompletedTasksCount(savedState.completedTasksCount || 0);
      // Don't restore running state - user should manually resume
    }
  }, [tasks.length]);
  
  // Save timer state periodically
  useEffect(() => {
    if (hasStartedTimer) {
      sessionStorage.saveTimerState({
        currentTaskIndex,
        timeRemaining,
        hasStartedTimer,
        completedTasksCount,
        isRunning: false // Always save as paused
      });
    }
  }, [currentTaskIndex, timeRemaining, hasStartedTimer, completedTasksCount]);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      const response = await apiRequest("POST", "/api/tasks", data);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task added successfully!" });
      
      // Update cached tasks immediately for offline support
      setCachedTasks(prev => [...prev, newTask]);
    },
    onError: (error) => {
      console.error('Task creation error:', error);
      toast({ title: "Failed to add task", variant: "destructive" });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertTask> }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${id}`, data);
      return response.json();
    },
    onSuccess: (updatedTask, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task updated successfully!" });
      
      // Update cached tasks immediately for offline support
      setCachedTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...data } : task
      ));
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task deleted successfully!" });
      
      // Update cached tasks immediately for offline support
      setCachedTasks(prev => prev.filter(task => task.id !== deletedId));
      
      // If we deleted a completed task, adjust the completed count
      const deletedTask = tasks.find(t => t.id === deletedId);
      if (deletedTask && !deletedTask.isInterval && currentTaskIndex > tasks.findIndex(t => t.id === deletedId)) {
        setCompletedTasksCount(prev => Math.max(0, prev - 1));
      }
    },
    onError: () => {
      toast({ title: "Failed to delete task", variant: "destructive" });
    },
  });

  // Timer logic - timestamp-based to prevent browser tab throttling
  const updateTimer = async () => {
    if (!endTime || !isRunning) return;
    
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
    
    setTimeRemaining(remaining);
    
    if (remaining <= 0) {
      // Timer finished
      const completedTask = tasks[currentTaskIndex];
      setIsRunning(false);
      setEndTime(null);
      localStorage.removeItem(`timer-${currentTaskIndex}-end`);
      
      // Only increment completed count for actual tasks (not breaks)
      if (completedTask && !completedTask.isInterval) {
        setCompletedTasksCount(prev => prev + 1);
      }
      
      toast({ title: `${completedTask?.isInterval ? 'Break' : 'Task'} completed!` });
      
      // Send push notification via server (works even when tab is closed)
      if (isPushNotificationEnabled && completedTask) {
        const completedTaskName = completedTask.isInterval ? 'Break' : completedTask.name;
        try {
          await apiRequest("POST", "/api/notify/task-complete", {
            taskName: completedTaskName
          });
        } catch (error) {
          console.error('Failed to send push notification:', error);
        }
      }
      
      // Move to next task if available and start automatically
      if (currentTaskIndex < tasks.length - 1) {
        const nextTask = tasks[currentTaskIndex + 1];
        setCurrentTaskIndex(prev => prev + 1);
        
        // Start next task automatically with timestamp approach
        setTimeout(async () => {
          const nextDurationMs = (nextTask?.duration || 0) * 60 * 1000;
          const nextEndTime = Date.now() + nextDurationMs;
          setEndTime(nextEndTime);
          setTimeRemaining(nextTask?.duration * 60 || 0);
          setIsRunning(true);
          localStorage.setItem(`timer-${currentTaskIndex + 1}-end`, nextEndTime.toString());
          
          // Send push notification for next task start
          if (isPushNotificationEnabled && nextTask) {
            const nextTaskName = nextTask.isInterval ? 'Break' : nextTask.name;
            try {
              await apiRequest("POST", "/api/notify/next-task", {
                taskName: nextTaskName
              });
            } catch (error) {
              console.error('Failed to send next task notification:', error);
            }
          }
        }, 100); // Small delay to ensure state updates
        
      } else {
        toast({ title: "All tasks completed!" });
        setCurrentTaskIndex(0);
        setTimeRemaining(0);
        setHasStartedTimer(false);
      }
    }
  };

  useEffect(() => {
    if (isRunning && endTime) {
      // Update immediately
      updateTimer();
      
      // Set up interval for regular updates
      timerRef.current = setInterval(updateTimer, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, endTime, currentTaskIndex, tasks, toast, isPushNotificationEnabled]);
  
  // Handle tab visibility changes - recalculate timer immediately when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isRunning && endTime) {
        updateTimer();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, endTime]);
  
  // Restore timer from localStorage on mount
  useEffect(() => {
    if (tasks.length > 0 && hasStartedTimer) {
      const storedEndTime = localStorage.getItem(`timer-${currentTaskIndex}-end`);
      if (storedEndTime) {
        const endTimeMs = parseInt(storedEndTime);
        const now = Date.now();
        
        if (endTimeMs > now) {
          // Timer is still running
          setEndTime(endTimeMs);
          setTimeRemaining(Math.ceil((endTimeMs - now) / 1000));
          // Don't auto-resume - let user manually resume if needed
        } else {
          // Timer has expired, clean up
          localStorage.removeItem(`timer-${currentTaskIndex}-end`);
        }
      }
    }
  }, [tasks.length, hasStartedTimer, currentTaskIndex]);

  // Reset timer when tasks change or current task changes (but not when pausing/resuming)
  useEffect(() => {
    if (tasks.length > 0 && currentTaskIndex < tasks.length) {
      if (!isRunning && !hasStartedTimer) {
        setTimeRemaining(tasks[currentTaskIndex]?.duration * 60 || 0);
      }
    } else {
      setTimeRemaining(0);
      setCurrentTaskIndex(0);
      setHasStartedTimer(false);
    }
  }, [tasks, currentTaskIndex, isRunning, hasStartedTimer]);

  const handleAddTask = (name: string, duration: number) => {
    // Just create the main task - no automatic breaks
    createTaskMutation.mutate({
      name,
      duration,
      isInterval: false,
    });
    setIsModalOpen(false);
  };

  const handleUpdateTask = (id: number, data: Partial<InsertTask>) => {
    updateTaskMutation.mutate({ id, data });
  };

  const handleDeleteTask = (id: number) => {
    // Check if task exists in server tasks before attempting delete
    const taskExistsOnServer = serverTasks.some(task => task.id === id);
    
    if (taskExistsOnServer) {
      deleteTaskMutation.mutate(id);
    } else {
      // Task only exists in cache, remove it from cache
      const deletedTask = tasks.find(t => t.id === id);
      setCachedTasks(prev => prev.filter(task => task.id !== id));
      setReorderedTasks(prev => prev ? prev.filter(task => task.id !== id) : null);
      sessionStorage.saveTasks(tasks.filter(task => task.id !== id));
      
      // If we deleted a completed task, adjust the completed count
      if (deletedTask && !deletedTask.isInterval && currentTaskIndex > tasks.findIndex(t => t.id === id)) {
        setCompletedTasksCount(prev => Math.max(0, prev - 1));
      }
      
      toast({ title: "Task removed from cache" });
    }
  };

  const handleReorderTasks = (newTasks: Task[]) => {
    // Update the reordered tasks state immediately for UI
    setReorderedTasks(newTasks);
    
    // Update both server data (for query cache) and cached tasks
    queryClient.setQueryData(["/api/tasks"], newTasks);
    setCachedTasks(newTasks);
    
    // Save to session storage for persistence
    sessionStorage.saveTasks(newTasks);
    
    // TODO: In a real app, you'd send the reordered list to the server
    // For now we just update the local state
  };

  const handleClearAllTasks = async () => {
    if (tasks.length === 0) return;
    
    try {
      // Delete all tasks one by one
      const deletePromises = tasks.map(task => 
        apiRequest("DELETE", `/api/tasks/${task.id}`)
      );
      
      await Promise.all(deletePromises);
      
      // Clear cached tasks and timer state
      setCachedTasks([]);
      sessionStorage.clearAll();
      setIsRunning(false);
      setTimeRemaining(0);
      setCurrentTaskIndex(0);
      setHasStartedTimer(false);
      setCompletedTasksCount(0);
      
      // Refresh the task list
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      toast({ title: "All tasks cleared!" });
      
    } catch (error) {
      console.error('Error clearing tasks:', error);
      toast({ title: "Failed to clear some tasks", variant: "destructive" });
    }
  };

  const handleSkipTask = () => {
    // Clean up current timer
    setIsRunning(false);
    setEndTime(null);
    localStorage.removeItem(`timer-${currentTaskIndex}-end`);
    
    if (currentTaskIndex < tasks.length - 1) {
      const completedTask = tasks[currentTaskIndex];
      const nextTask = tasks[currentTaskIndex + 1];
      
      setCurrentTaskIndex(prev => prev + 1);
      setTimeRemaining(nextTask?.duration * 60 || 0);
      
      toast({ title: `Skipped: ${completedTask?.isInterval ? 'Break' : completedTask?.name}` });
      
      // Send push notification for next task
      if (isPushNotificationEnabled && nextTask) {
        const nextTaskName = nextTask.isInterval ? 'Break' : nextTask.name;
        try {
          apiRequest("POST", "/api/notify/next-task", {
            taskName: nextTaskName
          });
        } catch (error) {
          console.error('Failed to send next task notification:', error);
        }
      }
    } else {
      // Skipping the last task
      setCurrentTaskIndex(0);
      setTimeRemaining(0);
      setHasStartedTimer(false);
      toast({ title: "All tasks completed!" });
    }
  };
  
  const handleResetTask = () => {
    if (tasks.length > 0 && currentTaskIndex < tasks.length) {
      const currentTask = tasks[currentTaskIndex];
      setTimeRemaining(currentTask?.duration * 60 || 0);
      setIsRunning(false);
      setEndTime(null);
      localStorage.removeItem(`timer-${currentTaskIndex}-end`);
      toast({ title: `Reset: ${currentTask?.isInterval ? 'Break' : currentTask?.name}` });
    }
  };

  const toggleTimer = () => {
    if (tasks.length === 0) {
      toast({ title: "Add tasks first", variant: "destructive" });
      return;
    }

    if (!isRunning) {
      // Starting or resuming timer
      if (!hasStartedTimer || !endTime) {
        // Starting fresh for the first time or after reset
        const currentTask = tasks[currentTaskIndex];
        const durationMs = (currentTask?.duration || 0) * 60 * 1000;
        const newEndTime = Date.now() + durationMs;
        
        setEndTime(newEndTime);
        setTimeRemaining(currentTask?.duration * 60 || 0);
        setHasStartedTimer(true);
        localStorage.setItem(`timer-${currentTaskIndex}-end`, newEndTime.toString());
        
        // Send push notification for task start
        if (isPushNotificationEnabled && currentTask) {
          const taskName = currentTask.isInterval ? 'Break' : currentTask.name;
          try {
            apiRequest("POST", "/api/notify/next-task", {
              taskName: taskName
            });
          } catch (error) {
            console.error('Failed to send task start notification:', error);
          }
        }
      }
      setIsRunning(true);
    } else {
      // Pausing timer - keep endTime in localStorage for resume
      setIsRunning(false);
    }
  };

  const handlePlayTask = () => {
    toggleTimer();
  };

  const handlePauseTask = () => {
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTask = tasks[currentTaskIndex];
  const totalTime = currentTask?.duration * 60 || 0;
  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;
  const completedTasks = currentTaskIndex;
  const totalTasks = tasks.length;

  return (
    <div 
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(circle at top left, rgba(79, 70, 229, 0.3) 0%, rgba(79, 70, 229, 0.1) 30%, transparent 60%),
          radial-gradient(circle at bottom right, rgba(147, 51, 234, 0.3) 0%, rgba(147, 51, 234, 0.1) 30%, transparent 60%),
          #ffffff
        `
      }}
    >
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-6"
        >
          <h1 className="text-[32px] font-bold text-gray-900 mb-2">Focus Timer</h1>
          <p className="text-[18px] text-gray-600 mb-8">Stay productive with focused work sessions</p>
        </motion.div>
        
        {/* Push Notification Settings */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-4"
        >
          <NotificationManager 
            onNotificationStateChange={setIsPushNotificationEnabled}
          />
        </motion.div>

        {/* Add Task Button */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#4F46E5] hover:bg-indigo-700 active:bg-purple-700 text-white rounded-lg font-medium text-lg shadow-lg"
            style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '12px', paddingBottom: '12px', borderRadius: '0.5rem' }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Task
          </Button>
        </motion.div>

        {/* Active Tasks or Empty State */}
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-600 py-8"
          >
            Loading tasks...
          </motion.div>
        ) : tasks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-[24px] font-bold text-gray-700 mb-2">No tasks yet</p>
            <p className="text-[18px] text-gray-500">Create your first timed task to get started</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Active Tasks
              </h3>
              {tasks.filter(t => !t.isInterval).length > 0 && (
                <div className="text-sm text-gray-600">
                  {completedTasksCount}/{tasks.filter(t => !t.isInterval).length} completed
                </div>
              )}
            </div>
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <ActiveTaskItem
                  key={task.id}
                  task={task}
                  isActive={index === currentTaskIndex}
                  onPlay={handlePlayTask}
                  onPause={handlePauseTask}
                  onDelete={handleDeleteTask}
                  onSkip={handleSkipTask}
                  onReset={handleResetTask}
                  isRunning={isRunning && index === currentTaskIndex}
                  isDeleting={deleteTaskMutation.isPending}
                  progress={index === currentTaskIndex ? progress : 0}
                  timeRemaining={index === currentTaskIndex ? timeRemaining : 0}
                  totalTime={task.duration * 60}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTask={handleAddTask}
        isLoading={createTaskMutation.isPending}
      />
      
      {/* Footer Credit */}
      <div className="text-center py-8">
        <p className="text-sm text-gray-400">
          Built by{' '}
          <a 
            href="https://www.linkedin.com/in/barrettle/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-gray-600 transition-colors"
          >
            Barrett Le
          </a>
        </p>
      </div>
    </div>
  );
}
