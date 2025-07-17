import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pen, Trash2, Check } from "lucide-react";
import type { Task, InsertTask } from "@shared/schema";

interface TaskItemProps {
  task: Task;
  onUpdate: (id: number, data: Partial<InsertTask>) => void;
  onDelete: (id: number) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function TaskItem({ task, onUpdate, onDelete, isUpdating, isDeleting }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(task.name);

  const handleEdit = () => {
    if (isEditing) {
      // Save edit
      if (editName.trim() && editName.trim() !== task.name) {
        onUpdate(task.id, { name: editName.trim() });
      }
      setIsEditing(false);
    } else {
      // Enter edit mode
      setEditName(task.name);
      setIsEditing(true);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      setEditName(task.name);
      setIsEditing(false);
    }
  };

  return (
    <div className={`flex items-center p-4 border border-gray-100 rounded-xl ${
      task.isInterval ? 'bg-green-50 border-green-200' : ''
    }`}>
      <div className="flex-1">
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyPress}
            className="bg-transparent border-b border-ios-blue outline-none font-medium text-gray-900 px-0"
            autoFocus
          />
        ) : (
          <div className="font-medium text-gray-900">
            {task.name}
            {task.isInterval && <span className="ml-2 text-xs text-ios-green">(Break)</span>}
          </div>
        )}
        <div className="text-sm text-ios-secondary">{task.duration} minutes</div>
      </div>
      <div className="flex space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEdit}
          disabled={isUpdating}
          className={`p-2 rounded-lg transition-colors ${
            isEditing
              ? 'text-ios-green hover:bg-green-50'
              : 'text-ios-blue hover:bg-blue-50'
          }`}
        >
          {isEditing ? (
            <Check className="w-4 h-4" />
          ) : (
            <Pen className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 text-ios-red hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
