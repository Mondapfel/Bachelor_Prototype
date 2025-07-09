// src/pages/KanbanView/Column.tsx

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

  // Is the cursor dragging over this column specifically (not just a task inside it)?
  const isOverColumn = over?.id === id;
  // Are we dragging over a task that is part of this column?
  const isOverTaskInThisColumn = tasks.some((t) => t.taskId === over?.id);
  // Should we show a placeholder? (Only if the task comes from a different column)
  const shouldShowPlaceholder = activeTask && activeTask.status !== id;

  return (
    // Main droppable container. min-h ensures it has a size even when the parent grid is small.
    <div
      ref={setNodeRef}
      className="flex flex-col p-2 rounded-lg bg-gray-100 min-h-[200px]"
    >
      {/* Title - does not grow */}
      <h3 className="text-lg font-bold mb-2 shrink-0">{status}</h3>

      {/* This div grows to fill all available vertical space, creating a large drop target */}
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

        {/*
          This is the key part for empty columns. Show the placeholder if:
          1. We are dragging over the column itself.
          2. We are NOT dragging over a task that's already in the column.
          3. The task is from a different column.
        */}
        {isOverColumn &&
          !isOverTaskInThisColumn &&
          shouldShowPlaceholder &&
          activeTask && (
            <div className="flex-grow">
              {" "}
              {/* This makes the placeholder expand to fill space */}
              <TaskPlaceholder task={activeTask} />
            </div>
          )}
      </div>
    </div>
  );
};

export default Column;
