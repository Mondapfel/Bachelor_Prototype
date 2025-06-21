// TaskTable.tsx
import React, { useState } from "react";
import {
  type ColumnDef,
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { Task } from "./types";

const columnHelper = createColumnHelper<Task>();

const INITIAL_DATA: Task[] = [
  { id: "1", title: "Design homepage", Priority: "Medium" },
  { id: "2", title: "Write blog post", priority: "High" },
  { id: "3", title: "Fix login bug", priority: "Low" },
];

export interface TaskTableProps {
  tasks: Task[];
  fields: string[];
  updateTask: (taskId: string, field: string, value: string) => void;
  deleteTask: (taskId: string) => void;
}

export default function TaskTable({
  tasks,
  fields,
  updateTask,
  deleteTask,
}: TaskTableProps) {
  const [data, setData] = useState<Task[]>(INITIAL_DATA);
  const [columns, setColumns] = useState<ColumnDef<Task, unknown>[]>([
    columnHelper.accessor("title", {
      id: "title",
      header: "Title",
      cell: (info) => info.getValue(),
    }) as ColumnDef<Task, unknown>,
  ]);

  const updateCell = (rowIndex: number, key: string, value: string) => {
    setData((old) =>
      old.map((row, i) => (i === rowIndex ? { ...row, [key]: value } : row))
    );
    const task = data[rowIndex];
    updateTask(task.id, key, value);
  };

  const addColumn = () => {
    const key = `custom_${Date.now()}`;
    const header = prompt("Column name")?.trim();
    if (!header) return;

    const newCol = columnHelper.accessor(key as any, {
      id: key,
      header,
      cell: (info) => (
        <input
          className="border p-1 w-full"
          value={(info.getValue() ?? "") as string}
          onChange={(e) => updateCell(info.row.index, key, e.target.value)}
        />
      ),
    }) as ColumnDef<Task, unknown>;

    setColumns((old) => [...old, newCol]);
    setData((old) => old.map((row) => ({ ...row, [key]: "" })));
  };

  const removeColumn = (colId: string) => {
    setColumns((old) => old.filter((col) => col.id !== colId));
    setData((old) =>
      old.map((row) => {
        const { [colId]: _, ...rest } = row;
        return rest as Task;
      })
    );
  };

  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <table className="min-w-full table-fixed border-collapse">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="border p-2 bg-gray-100 dark:bg-gray-800"
                >
                  <div className="flex justify-between items-center">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.id.startsWith("custom_") && (
                      <button
                        onClick={() => removeColumn(header.column.id)}
                        className="ml-2 text-red-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border p-2 w-screen">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
              <td>
                <button
                  onClick={() => deleteTask(row.original.id)}
                  className="text-red-600 hover:underline p-3 text-xl"
                >
                  -
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4">
        <button
          onClick={addColumn}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          + Add Column
        </button>
      </div>
    </div>
  );
}
