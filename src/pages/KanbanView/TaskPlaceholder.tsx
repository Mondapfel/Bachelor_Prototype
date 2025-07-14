import type { Priority, Task } from "@/data/TasksData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  ArrowBigDown,
  ArrowBigUp,
  ShieldAlert,
  ChevronsLeftRightEllipsis,
  CalendarDays,
} from "lucide-react";

interface TaskPlaceholderProps {
  task: Task;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

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

const TaskPlaceholder = ({ task }: TaskPlaceholderProps) => {
  const getPriorityClass = (priority: string | undefined) => {
    switch (priority) {
      case "Kritisch":
        return "text-purple-700 dark:text-purple-400";
      case "Hoch":
        return "text-red-700 dark:text-red-400";
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
    <Card className="p-4 mb-2 touch-none opacity-40 dark:bg-slate-800/50">
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
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center">
          {task.priority && PriorityIcon && (
            <>
              <PriorityIcon className={priorityColor} size={20} />
              <span className={`ml-2 ${priorityColor}`}>{task.priority}</span>
            </>
          )}
        </div>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <CalendarDays size={16} className="mr-2" />
          <span>{formatDate(task.dueDate)}</span>
        </div>
      </div>
    </Card>
  );
};

export default TaskPlaceholder;
