import React, { useState } from "react";
import type { Field, Task, TaskGroup } from "./types";
import TaskTable from "./TaskTable";

export default function ListView() {
  const [fields, setFields] = useState<Field[]>([
    "Title",
    "Priority",
    "Due Date",
    "Status",
  ]);

  const [groups, setGroups] = useState<TaskGroup[]>([
    {
      id: "g1",
      name: "To Do",
      collapsed: false,
      tasks: [],
    },
    { id: "g2", name: "Done", collapsed: false, tasks: [] },
  ]);

  const updateTask = (
    groupId: string,
    taskId: string,
    field: Field,
    value: string
  ) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              tasks: group.tasks.map((t) =>
                t.id === taskId ? { ...t, [field]: value } : t
              ),
            }
          : group
      )
    );
  };

  const deleteTask = (groupId: string, taskId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, tasks: g.tasks.filter((t) => t.id !== taskId) }
          : g
      )
    );
  };

  const addGroup = () => {
    setGroups((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "New Group",
        collapsed: false,
        tasks: [],
      },
    ]);
  };

  const deleteGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const addTask = (groupId: string) => {
    const newTask: Task = { id: Date.now().toString(), title: "New Task" };
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, tasks: [newTask, ...g.tasks] } : g
      )
    );
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Task List</h1>
        <div className=" space-x-2">
          <button
            onClick={addGroup}
            className="px-3 py-1 bg-purple-400 text-white rounded"
          >
            + Group
          </button>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.id} className="p-4 shadow space-y-2 rounded">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">{group.name}</span>
            <div className="space-x-2">
              <button
                onClick={() => addTask(group.id)}
                className="px-2 py-1 bg-pink-400 text-white rounded"
              >
                + Task
              </button>
              <button
                onClick={() => deleteGroup(group.id)}
                className="px-2 py-1 text-red-600 hover:underline"
              >
                Delete Group
              </button>
            </div>
          </div>
          {/*!group.collapsed && (
            <TaskTable
              tasks={group.tasks}
              fields={fields}
              updateTask={(taskId, field, value) =>
                updateTask(group.id, taskId, field as Field, value)
              }
              deleteTask={(taskId) => deleteTask(group.id, taskId)}
            />
          )*/}
        </div>
      ))}
    </div>
  );
}
