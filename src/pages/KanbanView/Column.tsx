import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable, useDndContext } from "@dnd-kit/core";
import type { Task, Status } from "@/data/TasksData";
import SortableTask from "./SortableTask";
import TaskPlaceholder from "./TaskPlaceholder";

type ColumnProps = {
  id: string;
  status: Status;
  tasks: Task[];
};

const Column: React.FC<ColumnProps> = ({ id, status, tasks }) => {
  const { setNodeRef } = useDroppable({
    id,
    data: { type: "Column" },
  });

  const { active, over } = useDndContext();
  const activeTask = active?.data.current?.task as Task | undefined;

  const isOverColumn = over?.id === id;
  const isOverTaskInThisColumn = tasks.some((t) => t.taskId === over?.id);
  const shouldShowPlaceholder = activeTask && activeTask.status !== id;

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col p-2 rounded-lg bg-gray-100 min-h-[200px]"
    >
      <h3 className="text-lg font-bold mb-2 shrink-0">{status}</h3>

      <div className="flex flex-col flex-grow">
        <SortableContext
          items={tasks.map((t) => t.taskId)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => {
            const isOverThisTask = over?.id === task.taskId;
            return (
              <div key={task.taskId}>
                {isOverThisTask && shouldShowPlaceholder && activeTask && (
                  <TaskPlaceholder task={activeTask} />
                )}
                <SortableTask task={task} />
              </div>
            );
          })}
        </SortableContext>

        {isOverColumn &&
          !isOverTaskInThisColumn &&
          shouldShowPlaceholder &&
          activeTask && (
            <div className="flex-grow">
              {" "}
              <TaskPlaceholder task={activeTask} />
            </div>
          )}
      </div>
    </div>
  );
};

export default Column;
