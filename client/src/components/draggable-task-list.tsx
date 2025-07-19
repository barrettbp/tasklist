import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { TaskItem } from './task-item';
import type { Task, InsertTask } from '@shared/schema';

interface DraggableTaskListProps {
  tasks: Task[];
  onUpdate: (id: number, data: Partial<InsertTask>) => void;
  onDelete: (id: number) => void;
  onReorder: (tasks: Task[]) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function DraggableTaskList({
  tasks,
  onUpdate,
  onDelete,
  onReorder,
  isUpdating,
  isDeleting
}: DraggableTaskListProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorder(items);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="tasks">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`space-y-3 ${snapshot.isDraggingOver ? 'bg-gray-50 rounded-lg p-2' : ''}`}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`${snapshot.isDragging ? 'rotate-1 shadow-lg scale-105' : ''} transition-all duration-200`}
                    style={provided.draggableProps.style}
                  >
                    <TaskItem
                      task={task}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                      isUpdating={isUpdating}
                      isDeleting={isDeleting}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}