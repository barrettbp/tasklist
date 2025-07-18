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
import { TimerDisplay } from "@/components/timer-display";
import { notificationManager } from "@/utils/notifications";
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
    const checkPermission = async () => {
      if (notificationManager.isSupported()) {
        const permission = notificationManager.getPermissionStatus();
        setHasNotificationPermission(permission === 'granted');
        
        if (permission === 'default') {
          // Request permission
          await Notification.requestPermission();
          setHasNotificationPermission(Notification.permission === 'granted');
        }
      }
    };
    checkPermission();
  }, []);

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      const response = await apiRequest("POST", "/api/tasks", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setTaskName("");
      toast({ title: "Task added successfully!" });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task updated successfully!" });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete task", variant: "destructive" });
    },
  });

  // Timer logic
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Timer finished
            const completedTask = tasks[currentTaskIndex];
            setIsRunning(false);
            toast({ title: `${completedTask?.isInterval ? 'Break' : 'Task'} completed!` });
            
            // Send notification
            if (hasNotificationPermission && completedTask) {
              const nextTask = tasks[currentTaskIndex + 1];
              notificationManager.showTaskComplete(
                completedTask.name,
                nextTask?.name
              );
            }
            
            // Move to next task if available
            if (currentTaskIndex < tasks.length - 1) {
              const nextTask = tasks[currentTaskIndex + 1];
              setCurrentTaskIndex(prev => prev + 1);
              setTimeRemaining(nextTask?.duration * 60 || 0);
              
              // Notify about next task start
              if (hasNotificationPermission && nextTask) {
                setTimeout(() => {
                  notificationManager.showTaskStart(nextTask.name);
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
        clearTimeout(timerRef.current);
      }
    };
  }, [isRunning, timeRemaining, currentTaskIndex, tasks, toast]);

  // Reset timer when tasks change or current task changes
  useEffect(() => {
    if (tasks.length > 0 && currentTaskIndex < tasks.length) {
      if (!isRunning) {
        setTimeRemaining(tasks[currentTaskIndex]?.duration * 60 || 0);
      }
    } else {
      setTimeRemaining(0);
      setCurrentTaskIndex(0);
    }
  }, [tasks, currentTaskIndex, isRunning]);

  const handleAddTask = () => {
    if (!taskName.trim()) {
      toast({ title: "Please enter a task name", variant: "destructive" });
      return;
    }

    createTaskMutation.mutate({
      name: taskName.trim(),
      duration: selectedDuration,
      isInterval: false,
    });
  };

  const handleUpdateTask = (id: number, data: Partial<InsertTask>) => {
    updateTaskMutation.mutate({ id, data });
  };

  const handleDeleteTask = (id: number) => {
    deleteTaskMutation.mutate(id);
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
        notificationManager.showTaskStart(nextTask.name);
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

    if (!isRunning && timeRemaining === 0) {
      // Starting fresh
      setTimeRemaining(tasks[currentTaskIndex]?.duration * 60 || 0);
      setHasStartedTimer(true);
      
      // Notify about task start
      if (hasNotificationPermission && tasks[currentTaskIndex]) {
        notificationManager.showTaskStart(tasks[currentTaskIndex].name);
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
        <div className="max-w-md mx-auto">
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

      <div className="max-w-md mx-auto p-6">
        {activeTab === 'run' ? (
          /* Run View */
          <div>
            {/* Timer Display */}
            <Card className="p-8 mb-6 text-center bg-white rounded-2xl shadow-sm">
              <TimerDisplay 
                timeRemaining={timeRemaining}
                progress={progress}
                currentTask={currentTask}
              />
              
              <div className="space-y-4">
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
                          {task.name}
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
          <div>
            {/* Notification Status */}
            {!hasNotificationPermission && notificationManager.isSupported() && (
              <Card className="p-4 mb-4 bg-amber-50 border-amber-200 rounded-2xl">
                <div className="flex items-center text-amber-800">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                  <div className="text-sm">
                    Enable notifications to get alerts when tasks complete
                  </div>
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
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                <List className="inline w-5 h-5 mr-2 text-ios-blue" />
                My Tasks
              </h3>
              
              {isLoading ? (
                <div className="text-center text-ios-secondary">Loading tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="text-center text-ios-secondary">
                  No tasks yet. Add your first task above!
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onUpdate={handleUpdateTask}
                      onDelete={handleDeleteTask}
                      isUpdating={updateTaskMutation.isPending}
                      isDeleting={deleteTaskMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
