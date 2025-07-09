import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import type { Task, Status } from "@/data/TasksData";
import SortableTask from "./SortableTask";

type ColumnProps = {
  id: string;
  status: Status;
  tasks: Task[];
};

const Column: React.FC<ColumnProps> = ({ id, status, tasks }) => {
    const { setNodeRef } = useDroppable({
        id,
        data: {
            type: 'Column'
        }
    });

  return (
    <div ref={setNodeRef} className="flex flex-col gap-2 p-2 rounded-lg bg-gray-100 min-h-[200px]">
      <h3 className="text-lg font-bold">{status}</h3>
      <SortableContext items={tasks.map((task) => task.taskId)} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => (
          <SortableTask key={task.taskId} task={task} />
        ))}
      </SortableContext>
    </div>
  );
};

export default Column;