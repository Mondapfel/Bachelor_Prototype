import React, { useState } from "react";

type Task = {
  id: string;
  title: string;
};

type TaskGroup = {
  id: string;
  name: string;
  collapsed: boolean;
  tasks: Task[];
};

const ListView: React.FC = () => {
  const [groups, setGroups] = useState<TaskGroup[]>([
    {
      id: "1",
      name: "To Do",
      collapsed: false,
      tasks: [
        {
          id: "1",
          title: "New Task",
        },
      ],
    },
  ]);

  //add new Divider Group
  const addGroup = () => {
    const newGroup: TaskGroup = {
      id: Date.now().toString(),
      name: `Group ${groups.length + 1}`,
      collapsed: false,
      tasks: [],
    };
    setGroups((prev) => [...prev, newGroup]);
  };

  //remove Divider Group
  const deleteGroup = (id: string) => {
    setGroups((prev) => prev.filter((group) => group.id !== id));
  };

  //add new Task to first Group
  const addTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: "New Task",
    };

    setGroups((prevGroups) => {
      const [firstGroup, ...rest] = prevGroups;
      const updatedFirstGroup = {
        ...firstGroup,
        tasks: [newTask, ...firstGroup.tasks],
      };
      return [updatedFirstGroup, ...rest];
    });
  };

  //delete task from group
  const deleteTask = (groupId: string, taskId: string) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              tasks: group.tasks.filter((task) => task.id !== taskId),
            }
          : group
      )
    );
  };

  const toggleCollapse = (groupId: string) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, collapsed: !group.collapsed } : group
      )
    );
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Task List</h1>
        <button
          onClick={addGroup}
          className="px-3 py-1 bg-green-600 text-white rounded"
        >
          + Add Group
        </button>
        <button
          onClick={addTask}
          className="px-3 py-1 bg-green-600 text-white rounded"
        >
          + Add Task
        </button>
      </div>

      {groups.map((group) => (
        <div key={group.id} className=" p-4 rounded shadow space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <button
                onClick={() => toggleCollapse(group.id)}
                className="text-lg font-semibold"
              >
                {group.collapsed ? ">" : "v"}
              </button>
              <span className="font-semibold text-lg">{group.name}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => deleteGroup(group.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Delete Group
              </button>
            </div>
          </div>

          {!group.collapsed &&
            group.tasks.map((task) => (
              <div
                key={task.id}
                className="flex justify-between items-center px-2 py-1 border rounded"
              >
                <input
                  value={task.title}
                  onChange={(e) => {
                    setGroups((prev) =>
                      prev.map((g) =>
                        g.id === group.id
                          ? {
                              ...g,
                              tasks: g.tasks.map((t) =>
                                t.id === task.id
                                  ? { ...t, title: e.target.value }
                                  : t
                              ),
                            }
                          : g
                      )
                    );
                  }}
                  className="w-full p-1 bg-gray-50 rounded"
                />
                <button
                  onClick={() => deleteTask(group.id, task.id)}
                  className="ml-2 text-sm text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
};

export default ListView;
