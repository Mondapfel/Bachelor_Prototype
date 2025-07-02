import React, { useState } from "react";
import type { TaskGroup } from "./types";
import TaskArea from "./TaskArea";
import TaskDialog from "@/components/taskDialogue/taskDialog";

export default function ListView() {
  const [groups, setGroups] = useState<TaskGroup[]>([
    {
      id: "g1",
      name: "Aufgaben",
      collapsed: false,
      tasks: [],
    },
  ]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Aufgaben Board</h1>
        <div className=" space-x-2"></div>
      </div>

      {groups.map((group) => (
        <div
          key={group.id}
          className="p-4  shadow space-y-2 rounded-2xl"
        >
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">{group.name}</span>
            <div className="space-x-2">
              <TaskDialog />
            </div>
          </div>
          {<TaskArea />}
        </div>
      ))}
    </div>
  );
}
