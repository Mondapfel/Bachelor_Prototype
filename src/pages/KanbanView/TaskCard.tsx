import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/data/TasksData";
import { Star, Flag } from "lucide-react"; // Using lucide-react for icons, make sure to install it

interface TaskCardProps {
  task: Task;
}

const TaskCard = ({ task }: TaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.taskId,
      data: {
        type: "Task",
        task,
      },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1, // Make the card semi-transparent while dragging
  };

  const getPriorityClass = (priority: string | undefined) => {
    switch (priority) {
      case "High":
        return "text-red-500";
      case "Medium":
        return "text-yellow-500";
      case "Low":
        return "text-green-500";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 bg-white rounded-lg shadow-md cursor-grab active:cursor-grabbing"
    >
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-lg">{task.title}</h3>
        {task.isFavorite && <Star className="text-yellow-400" size={20} />}
      </div>
      {task.label && (
        <div className="mt-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {task.label}
          </span>
        </div>
      )}
      <div className="flex items-center mt-4">
        <Flag className={getPriorityClass(task.priority)} size={20} />
        <span className={`ml-2 ${getPriorityClass(task.priority)}`}>
          {task.priority}
        </span>
      </div>
    </div>
  );
};

export default TaskCard;
