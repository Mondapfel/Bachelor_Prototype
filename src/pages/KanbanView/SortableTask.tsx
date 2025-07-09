import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/data/TasksData';

const SortableTask: React.FC<{ task: Task }> = ({ task }) => {
  // Defensive check to prevent crash if task is undefined
  if (!task) {
    return null;
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.taskId, data: {type: 'Task', task} });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-lg p-3 shadow-sm mb-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex justify-between items-center">
        <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{task.title}</span>
        {task.isFavorite && <span title="Favorit">⭐</span>}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span>{task.label}</span> • <span>{task.priority}</span>
      </div>
    </div>
  );
};

export default SortableTask;
