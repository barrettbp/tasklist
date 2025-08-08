import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Clock } from "lucide-react";
import { AddTaskModal } from "@/components/add-task-modal";
import { ActiveTaskItem } from "@/components/active-task-item";
import { notificationManager } from "@/utils/notifications";
import { sessionStorage } from "@/utils/sessionStorage";
import type { Task, InsertTask } from "@shared/schema";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [hasStartedTimer, setHasStartedTimer] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Check notification permission on mount and request if needed
  useEffect(() => {
    const checkAndRequestPermission = async () => {
      if (notificationManager.isSupported()) {
        const permission = notificationManager.getPermissionStatus();
        setHasNotificationPermission(permission === 'granted');
        
        // Auto-request permission on first load if not already decided
        if (permission === 'default') {
          const newPermission = await notificationManager.requestPermission();
          setHasNotificationPermission(newPermission === 'granted');
        }
      }
    };
    checkAndRequestPermission();
  }, []);

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
        isRunning: false // Always save as paused
      });
    }
  }, [currentTaskIndex, timeRemaining, hasStartedTimer]);

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
    },
    onError: () => {
      toast({ title: "Failed to delete task", variant: "destructive" });
    },
  });

  // Timer logic - using setInterval for better background tab support
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Timer finished
            const completedTask = tasks[currentTaskIndex];
            setIsRunning(false);
            toast({ title: `${completedTask?.isInterval ? 'Break' : 'Task'} completed!` });
            
            // Send browser notification (works even in background)
            if (hasNotificationPermission && completedTask) {
              const nextTask = tasks[currentTaskIndex + 1];
              const completedTaskName = completedTask.isInterval ? 'Break' : completedTask.name;
              const nextTaskName = nextTask?.isInterval ? 'Break' : nextTask?.name;
              notificationManager.showTaskComplete(
                completedTaskName,
                nextTaskName
              );
            }
            
            // Move to next task if available and start automatically
            if (currentTaskIndex < tasks.length - 1) {
              const nextTask = tasks[currentTaskIndex + 1];
              setCurrentTaskIndex(prev => prev + 1);
              setTimeRemaining(nextTask?.duration * 60 || 0);
              setIsRunning(true); // Auto-start next task
              
              // Notify about next task start
              if (hasNotificationPermission && nextTask) {
                setTimeout(() => {
                  const nextTaskName = nextTask.isInterval ? 'Break' : nextTask.name;
                  notificationManager.showTaskStart(nextTaskName);
                }, 2000); // Delay to not overlap with completion notification
              }
            } else {
              toast({ title: "All tasks completed!" });
              setCurrentTaskIndex(0);
              setTimeRemaining(0);
              setHasStartedTimer(false);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timeRemaining, currentTaskIndex, tasks, toast, hasNotificationPermission]);

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
    deleteTaskMutation.mutate(id);
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
      
      // Refresh the task list
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      toast({ title: "All tasks cleared!" });
      
    } catch (error) {
      console.error('Error clearing tasks:', error);
      toast({ title: "Failed to clear some tasks", variant: "destructive" });
    }
  };

  const handleEnableNotifications = async () => {
    if (notificationManager.isSupported()) {
      const permission = await Notification.requestPermission();
      setHasNotificationPermission(permission === 'granted');
      if (permission === 'granted') {
        toast({ title: "Notifications enabled!" });
      }
    }
  };

  const handleSkipTask = () => {
    if (currentTaskIndex < tasks.length - 1) {
      const completedTask = tasks[currentTaskIndex];
      const nextTask = tasks[currentTaskIndex + 1];
      
      setCurrentTaskIndex(prev => prev + 1);
      setTimeRemaining(nextTask?.duration * 60 || 0);
      setIsRunning(false);
      
      toast({ title: `Skipped: ${completedTask?.name}` });
      
      // Notify about next task
      if (hasNotificationPermission && nextTask) {
        const nextTaskName = nextTask.isInterval ? 'Break' : nextTask.name;
        notificationManager.showTaskStart(nextTaskName);
      }
    } else {
      // Skipping the last task
      setCurrentTaskIndex(0);
      setTimeRemaining(0);
      setIsRunning(false);
      setHasStartedTimer(false);
      toast({ title: "All tasks completed!" });
    }
  };

  const toggleTimer = () => {
    if (tasks.length === 0) {
      toast({ title: "Add tasks first", variant: "destructive" });
      return;
    }

    if (!isRunning && !hasStartedTimer) {
      // Starting fresh for the first time
      setTimeRemaining(tasks[currentTaskIndex]?.duration * 60 || 0);
      setHasStartedTimer(true);
      
      // Notify about task start
      if (hasNotificationPermission && tasks[currentTaskIndex]) {
        const taskName = tasks[currentTaskIndex].isInterval ? 'Break' : tasks[currentTaskIndex].name;
        notificationManager.showTaskStart(taskName);
      }
    }

    setIsRunning(!isRunning);
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
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center pt-6">
          <h1 className="text-[32px] font-bold text-gray-900 mb-2">Focus Timer</h1>
          <p className="text-[18px] text-gray-600 mb-8">Stay productive with focused work sessions</p>
        </div>
        {/* Add Task Button */}
        <div className="text-center">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium text-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Active Tasks */}
        <Card className="p-4 bg-white rounded-2xl shadow-sm">
          {tasks.length > 0 && (
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Active Tasks
            </h3>
          )}
          
          {isLoading ? (
            <div className="text-center text-gray-500 py-8">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-[24px] font-bold text-gray-900 mb-2">No tasks yet</p>
              <p className="text-[18px] text-gray-600">Add your first task to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <ActiveTaskItem
                  key={task.id}
                  task={task}
                  isActive={index === currentTaskIndex}
                  onPlay={handlePlayTask}
                  onPause={handlePauseTask}
                  onDelete={handleDeleteTask}
                  isRunning={isRunning && index === currentTaskIndex}
                  isDeleting={deleteTaskMutation.isPending}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTask={handleAddTask}
        isLoading={createTaskMutation.isPending}
      />
    </div>
  );
}
