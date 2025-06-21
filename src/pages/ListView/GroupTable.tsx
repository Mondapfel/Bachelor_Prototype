import React from "react";
import { useReactTable } from "@tanstack/react-table";
import type { Field, Task, TaskGroup } from "./types";

type Props = {
  group: TaskGroup;
  fields: Field[];
  updateTask: (
    groupId: string,
    taskId: string,
    field: Field,
    value: string
  ) => void;
  deleteTask: (groupId: string, taskId: string) => void;
};

const GroupTable: React.FC<Props> = ({
  group,
  fields,
  updateTask,
  deleteTask,
}) => (
  <table className="w-full table-auto">
    <thead>
      <tr>
        {fields.map((f) => (
          <th key={f} className="border px-2 py-1">
            {f}
          </th>
        ))}
        <th className="border px-2 py-1">Actions</th>
      </tr>
    </thead>
    <tbody>
      {group.tasks.map((task) => (
        <tr key={task.id} className="border-t">
          {fields.map((f) => (
            <td key={f} className="px-2 py-1">
              <input
                value={task[f] || ""}
                onChange={(e) =>
                  updateTask(group.id, task.id, f, e.target.value)
                }
                className="w-full p-1 border rounded"
              />
            </td>
          ))}
          <td className="px-2 py-1">
            <button
              className="text-red-500 hover:underline"
              onClick={() => deleteTask(group.id, task.id)}
            >
              Delete
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default GroupTable;
