import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/data/TasksData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Flag } from "lucide-react";

interface SortableTaskProps {
  task: Task;
}

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
        return "text-violet-500";
      case "Hoch":
        return "text-red-500";
      case "Mittel":
        return "text-yellow-500";
      case "Niedrig":
        return "text-green-500";
      default:
        return "text-gray-400";
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 mb-2 touch-none"
    >
      <div className="flex justify-between items-start">
        <span className="font-bold">{task.title}</span>
        {task.isFavorite && <Star className="text-yellow-400" size={20} />}
      </div>
      {task.label && (
        <div className="mt-2">
          <Badge variant="secondary">{task.label}</Badge>
        </div>
      )}
      <div className="flex items-center mt-4">
        {task.priority && (
          <>
            <Flag className={getPriorityClass(task.priority)} size={20} />
            <span className={`ml-2 ${getPriorityClass(task.priority)}`}>
              {task.priority}
            </span>
          </>
        )}
      </div>
    </Card>
  );
};

export default SortableTask;
