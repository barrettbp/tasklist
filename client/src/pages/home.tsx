import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Settings, List, Plus, Pen, Trash2, Check } from "lucide-react";
import { TimePicker } from "@/components/time-picker";
import { TaskItem } from "@/components/task-item";
import { DraggableTaskList } from "@/components/draggable-task-list";
import { TimerDisplay } from "@/components/timer-display";
import { notificationManager } from "@/utils/notifications";
import { sessionStorage } from "@/utils/sessionStorage";
import type { Task, InsertTask } from "@shared/schema";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"run" | "setup">("run");
  const [taskName, setTaskName] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [hasStartedTimer, setHasStartedTimer] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Check notification permission on mount
  useEffect(() => {
    const checkPermission = () => {
      if (notificationManager.isSupported()) {
        const permission = notificationManager.getPermissionStatus();
        setHasNotificationPermission(permission === 'granted');
      }
    };
    checkPermission();
  }, []);

  // Fetch tasks with session storage fallback
  const { data: serverTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Use session storage as backup when server is unavailable
  const [cachedTasks, setCachedTasks] = useState<Task[]>([]);
  const tasks = serverTasks.length > 0 ? serverTasks : cachedTasks;
  
  // Load cached tasks on mount
  useEffect(() => {
    const cached = sessionStorage.loadTasks();
    setCachedTasks(cached);
  }, []);
  
  // Save tasks to session storage whenever they change
  useEffect(() => {
    if (tasks.length > 0) {
      sessionStorage.saveTasks(tasks);
    }
  }, [tasks]);
  
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
      return response.json();
    },
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setTaskName("");
      setSelectedDuration(25);
      toast({ title: "Task added successfully!" });
      
      // Update cached tasks immediately for offline support
      setCachedTasks(prev => [...prev, newTask]);
    },
    onError: () => {
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

  const handleAddTask = () => {
    if (!taskName.trim()) {
      toast({ title: "Please enter a task name", variant: "destructive" });
      return;
    }

    // Create both the main task and break in one operation to avoid duplicate breaks
    const mainTask = {
      name: taskName.trim(),
      duration: selectedDuration,
      isInterval: false,
    };

    const breakTask = {
      name: "Break",
      duration: 5,
      isInterval: true,
    };

    // Add main task first
    createTaskMutation.mutate(mainTask, {
      onSuccess: () => {
        // Only add break after main task is successfully created
        createTaskMutation.mutate(breakTask);
      }
    });
  };

  const handleUpdateTask = (id: number, data: Partial<InsertTask>) => {
    updateTaskMutation.mutate({ id, data });
  };

  const handleDeleteTask = (id: number) => {
    deleteTaskMutation.mutate(id);
  };

  const handleReorderTasks = (reorderedTasks: Task[]) => {
    // Update the local state immediately for smooth UX
    setCachedTasks(reorderedTasks);
    
    // TODO: In a real app, you'd send the reordered list to the server
    // For now, we just update the local cached tasks
    sessionStorage.saveTasks(reorderedTasks);
  };

  const handleClearAllTasks = () => {
    if (tasks.length > 0) {
      // Clear all tasks from server and local storage
      tasks.forEach(task => {
        if (task.id) {
          deleteTaskMutation.mutate(task.id);
        }
      });
      // Clear cached tasks and timer state
      setCachedTasks([]);
      sessionStorage.clearAll();
      setIsRunning(false);
      setTimeRemaining(0);
      setCurrentTaskIndex(0);
      setHasStartedTimer(false);
      toast({ title: "All tasks cleared!" });
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
      toast({ title: "Add tasks in Setup tab first", variant: "destructive" });
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTask = tasks[currentTaskIndex];
  const totalTime = currentTask?.duration * 60 || 0;
  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;

  return (
    <div className="bg-ios-gray min-h-screen">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto lg:max-w-2xl xl:max-w-4xl">
          <div className="flex relative">
            <div 
              className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-ios-blue transition-transform duration-300"
              style={{ transform: `translateX(${activeTab === 'setup' ? '100%' : '0%'})` }}
            />
            <Button
              variant="ghost"
              className={`flex-1 py-4 text-center font-medium rounded-none ${
                activeTab === 'run' ? 'text-ios-blue' : 'text-ios-secondary'
              }`}
              onClick={() => setActiveTab('run')}
            >
              <Play className="w-4 h-4 mr-2" />
              Run
            </Button>
            <Button
              variant="ghost"
              className={`flex-1 py-4 text-center font-medium rounded-none ${
                activeTab === 'setup' ? 'text-ios-blue' : 'text-ios-secondary'
              }`}
              onClick={() => setActiveTab('setup')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Setup
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 sm:p-6 lg:max-w-2xl xl:max-w-4xl">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-12">
        {activeTab === 'run' ? (
          /* Run View */
          <div className="lg:col-span-2 xl:col-span-1">
            {/* Timer Display */}
            <Card className="p-4 sm:p-8 mb-6 text-center bg-white rounded-2xl shadow-sm">
              <TimerDisplay 
                timeRemaining={timeRemaining}
                progress={progress}
                currentTask={currentTask}
              />
              
              <div className="flex flex-col items-center space-y-6">
                <Button
                  size="lg"
                  className={`px-8 py-4 rounded-full text-lg font-semibold shadow-lg transform transition-transform active:scale-95 ${
                    isRunning 
                      ? 'bg-ios-red hover:bg-ios-red/90 text-white' 
                      : 'bg-ios-blue hover:bg-ios-blue/90 text-white'
                  }`}
                  onClick={toggleTimer}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      {hasStartedTimer && timeRemaining > 0 ? 'Resume' : 'Play'}
                    </>
                  )}
                </Button>
                
                {tasks.length > 0 && (
                  <button
                    onClick={handleSkipTask}
                    className="text-ios-secondary text-sm hover:underline hover:text-gray-700 transition-colors"
                  >
                    Skip
                  </button>
                )}
              </div>
            </Card>

            {/* Task Queue */}
            <Card className="p-6 bg-white rounded-2xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                <List className="inline w-5 h-5 mr-2 text-ios-blue" />
                Task Queue
              </h3>
              
              {tasks.length === 0 ? (
                <div className="text-center text-ios-secondary">
                  No tasks in queue. Add tasks in Setup tab.
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className={`flex items-center p-3 rounded-xl ${
                        index === currentTaskIndex 
                          ? 'bg-ios-gray' 
                          : 'bg-gray-50'
                      }`}
                    >
                      <div 
                        className={`w-3 h-3 rounded-full mr-4 ${
                          index === currentTaskIndex 
                            ? (task.isInterval ? 'bg-ios-green' : 'bg-ios-blue')
                            : 'bg-gray-300'
                        }`} 
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${
                          index === currentTaskIndex 
                            ? 'text-gray-900' 
                            : 'text-gray-600'
                        }`}>
                          {task.isInterval ? 'Break' : task.name}
                        </div>
                        <div className="text-sm text-ios-secondary">
                          {task.duration} minutes {task.isInterval && '(Break)'}
                        </div>
                      </div>
                      {index === currentTaskIndex && (
                        <div className="text-xs text-ios-secondary">Current</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ) : (
          /* Setup View */
          <div className="lg:col-span-2 xl:col-span-1">
            {/* Notification Status */}
            {!hasNotificationPermission && notificationManager.isSupported() && (
              <Card className="p-4 mb-4 bg-amber-50 border-amber-200 rounded-2xl">
                <div className="flex items-center justify-between text-amber-800">
                  <div className="flex items-center flex-1">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                    <div className="text-sm">
                      Enable notifications to get alerts when tasks complete
                    </div>
                  </div>
                  <Button
                    onClick={handleEnableNotifications}
                    size="sm"
                    className="ml-3 hover:bg-amber-700 text-white text-xs px-3 py-1 rounded-lg bg-[#1bc904]"
                  >
                    Enable
                  </Button>
                </div>
              </Card>
            )}

            {/* Add Task Form */}
            <Card className="p-6 mb-6 bg-white rounded-2xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                <Plus className="inline w-5 h-5 mr-2 text-ios-blue" />
                Add New Task
              </h3>
              
              <div className="space-y-6">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Name
                  </Label>
                  <Input
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    placeholder="Enter task name..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ios-blue focus:border-transparent"
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </Label>
                  <TimePicker 
                    value={selectedDuration}
                    onChange={setSelectedDuration}
                  />
                </div>
                
                <Button
                  onClick={handleAddTask}
                  disabled={createTaskMutation.isPending}
                  className="w-full bg-ios-blue hover:bg-ios-blue/90 text-white py-4 rounded-xl font-semibold text-lg shadow-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Task
                </Button>
              </div>
            </Card>

            {/* Task List */}
            <Card className="p-6 bg-white rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  <List className="inline w-5 h-5 mr-2 text-ios-blue" />
                  My Tasks
                </h3>
                {tasks.length > 2 && (
                  <button
                    onClick={handleClearAllTasks}
                    className="text-ios-secondary text-sm hover:text-red-600 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              
              {isLoading ? (
                <div className="text-center text-ios-secondary">Loading tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="text-center text-ios-secondary">
                  No tasks yet. Add your first task above!
                </div>
              ) : (
                <DraggableTaskList
                  tasks={tasks}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                  onReorder={handleReorderTasks}
                  isUpdating={updateTaskMutation.isPending}
                  isDeleting={deleteTaskMutation.isPending}
                />
              )}
            </Card>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
