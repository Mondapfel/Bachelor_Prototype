import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Priority, Task } from "@/data/TasksData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  ArrowBigDown,
  ArrowBigUp,
  ShieldAlert,
  ChevronsLeftRightEllipsis,
} from "lucide-react";

interface SortableTaskProps {
  task: Task;
}

const renderPriorityIcons = (priority: Priority) => {
  switch (priority) {
    case "Niedrig":
      return ArrowBigDown;
    case "Mittel":
      return ChevronsLeftRightEllipsis;
    case "Hoch":
      return ArrowBigUp;
    case "Kritisch":
      return ShieldAlert;
    default:
      return null;
  }
};

const SortableTask = ({ task }: SortableTaskProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.taskId,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0 : 1,
  };

  const getPriorityClass = (priority: string | undefined) => {
    switch (priority) {
      case "Kritisch":
        return "text-purple-700 dark:text-purple-400";
      case "Hoch":
        return "text-red-600 dark:text-red-400";
      case "Mittel":
        return "text-yellow-600 dark:text-yellow-400";
      case "Niedrig":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const PriorityIcon = task.priority
    ? renderPriorityIcons(task.priority)
    : null;
  const priorityColor = getPriorityClass(task.priority);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 mb-2 touch-none dark:bg-slate-800/50"
    >
      <div className="flex justify-between items-start">
        <span className="font-bold">{task.title}</span>
        {task.isFavorite && <Star className="text-yellow-400" size={20} />}
      </div>
      {task.label && (
        <div className="mt-2">
          <Badge
            className="bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-800/50 dark:border-blue-900 dark:text-blue-300 border border-dashed"
            variant="secondary"
          >
            {task.label}
          </Badge>
        </div>
      )}
      <div className="flex items-center">
        {task.priority && PriorityIcon && (
          <>
            <PriorityIcon className={priorityColor} size={20} />
            <span className={`ml-2 ${priorityColor}`}>{task.priority}</span>
          </>
        )}
      </div>
    </Card>
  );
};

export default SortableTask;
