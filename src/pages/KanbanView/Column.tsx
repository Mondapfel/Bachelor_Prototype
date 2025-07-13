import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable, useDndContext } from "@dnd-kit/core";
import type { Task, Status } from "@/data/TasksData";
import SortableTask from "./SortableTask";
import TaskPlaceholder from "./TaskPlaceholder";
import {
  Circle,
  CircleCheckBig,
  CircleDashed,
  CircleFadingArrowUp,
  CircleOff,
} from "lucide-react";

type ColumnProps = {
  id: string;
  status: Status;
  tasks: Task[];
};

const renderStatusIcons = (status: Status) => {
  switch (status) {
    case "Start ausstehend":
      return CircleDashed;
    case "Zu Erledigen":
      return Circle;
    case "In Bearbeitung":
      return CircleFadingArrowUp;
    case "Erledigt":
      return CircleCheckBig;
    case "Blockiert":
      return CircleOff;
    default:
      return null;
  }
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

  const StatusIcon = renderStatusIcons(status);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-2 shrink-0">
        {StatusIcon && <StatusIcon className="size-5 text-gray-500" />}
        <h3 className="text-lg font-bold">{status}</h3>
      </div>
      <div
        ref={setNodeRef}
        className="flex flex-col flex-grow p-2 rounded-lg bg-gray-100 dark:bg-slate-900/80 min-h-[200px]"
      >
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
    </div>
  );
};

export default Column;
