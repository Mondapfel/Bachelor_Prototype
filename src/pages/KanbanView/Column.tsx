import React from "react";
import type { Status, Task } from "@/data/TasksData";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableTask from "./SortableTask";

type ColumnProps = {
  id: string;
  status: Status;
  tasks: Task[];
};

const Column: React.FC<ColumnProps> = ({ id, status, tasks }) => {
  return (
    <div>
      <h2 className="font-semibold mb-3">{status}</h2>
      <SortableContext
        items={tasks.map((task) => task.taskId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="h-250 column bg-muted rounded-md p-4">
          {tasks.map((task) => (
            <SortableTask key={task.taskId} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default Column;
