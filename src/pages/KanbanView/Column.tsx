import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Task } from "@/data/TasksData"; // Make sure Task is imported

type ColumnProps = {
  status: string;
  tasks: Task[];
};

const Column: React.FC<ColumnProps> = ({ status, tasks }) => {
  return (
    <div className="flex flex-col">
      <h3 className="mb-2 font-medium text-gray-700 dark:text-gray-200">
        {status}
      </h3>

      <SortableContext
        items={tasks.map((task) => task.taskId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="h-250 bg-muted rounded-md p-4">
          {tasks.map((task) => (
            <div key={task.taskId} className="rounded p-2 shadow mb-2">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 dark:text-gray-400">⋮</span>
                <span className="dark:text-gray-200">{task.title}</span>
              </div>
            </div>
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default Column;
