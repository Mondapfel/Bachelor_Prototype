import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Priority, Task } from "@/data/TasksData";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  ArrowBigDown,
  ArrowBigUp,
  ShieldAlert,
  ChevronsLeftRightEllipsis,
  CalendarDays,
} from "lucide-react";
import React, { useState } from "react";
import { TaskDropDown } from "@/components/DropDowns/TasksDropDown/tasksDropDown";

interface SortableTaskProps {
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

const getLabelStyling = (label: string | undefined): string => {
  if (!label) return "";
  const blueLabels = ["Bug", "Feature", "Dokumentation"];
  if (blueLabels.includes(label)) {
    return "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-800/50 dark:border-blue-900 dark:text-blue-300 border border-dashed";
  }
  return "";
};

const SortableTask = ({ task }: SortableTaskProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    opacity: isDragging ? 0.5 : 1,
  };

  const PriorityIcon = task.priority
    ? renderPriorityIcons(task.priority)
    : null;
  const priorityColor = getPriorityClass(task.priority);
  const customLabelStyle = getLabelStyling(task.label);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="p-4 mb-2 touch-none dark:bg-slate-800/50 cursor-grab min-h-[230px] flex flex-col justify-between"
    >
      <CardHeader className="p-0">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-sm font-bold line-clamp-2 min-h-[40px]">
            {task.title}
          </CardTitle>
          {task.isFavorite && (
            <Star className="text-yellow-400 flex-shrink-0" size={18} />
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 mt-2">
        <div className="flex items-center space-x-2">
          {task.label && (
            <Badge variant="outline" className={customLabelStyle}>
              {task.label}
            </Badge>
          )}
          <Badge
            variant="outline"
            className={`flex items-center gap-1 ${priorityColor}`}
          >
            {PriorityIcon && <PriorityIcon size={14} />}
            {task.priority}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="p-0 mt-2 flex justify-between items-center">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <CalendarDays size={16} className="mr-2" />
          <span>{formatDate(task.dueDate)}</span>
        </div>
        <div className="w-8 h-8">
          {(isHovered || isMenuOpen) && (
            <TaskDropDown task={task} onOpenChange={setIsMenuOpen} />
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default SortableTask;
