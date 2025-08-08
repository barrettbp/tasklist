import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (name: string, duration: number) => void;
  isLoading?: boolean;
}

const QUICK_DURATIONS = [5, 15, 25, 45, 60];

export function AddTaskModal({ isOpen, onClose, onAddTask, isLoading = false }: AddTaskModalProps) {
  const [taskName, setTaskName] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(25);

  const handleSubmit = () => {
    if (!taskName.trim()) return;
    onAddTask(taskName.trim(), selectedDuration);
    setTaskName("");
    setSelectedDuration(25);
  };

  const handleClose = () => {
    setTaskName("");
    setSelectedDuration(25);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">Add New Task</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Task Name
            </Label>
            <Input
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter task name"
              className="w-full px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ borderRadius: '0.5rem' }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Duration
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {QUICK_DURATIONS.map((duration) => (
                <Button
                  key={duration}
                  variant={selectedDuration === duration ? "default" : "outline"}
                  className={`py-3 text-sm font-medium ${
                    selectedDuration === duration
                      ? 'bg-[#4F46E5] hover:bg-indigo-700 active:bg-purple-700 text-white'
                      : 'bg-white hover:bg-gray-50 active:bg-purple-700 active:text-white text-gray-700 border-gray-200'
                  }`}
                  style={{ borderRadius: '0.5rem' }}
                  onClick={() => setSelectedDuration(duration)}
                >
                  {duration}m
                </Button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!taskName.trim() || isLoading}
              className="w-full bg-[#4F46E5] hover:bg-indigo-700 active:bg-purple-700 text-white py-3 font-medium"
              style={{ borderRadius: '0.5rem' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}