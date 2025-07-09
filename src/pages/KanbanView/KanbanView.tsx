// src/pages/KanbanView/KanbanView.tsx

import {
  DndContext,
  // REMOVE closestCorners and import pointerWithin
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useTasksDataStore } from "@/hooks/useTasksDataStore";
import type { Task, Status } from "@/data/TasksData";
import { useState, useEffect, useMemo } from "react";
import Column from "./Column";
import SortableTask from "./SortableTask";

const KanbanView = () => {
  const { tasks: initialTasks, updateTasks } = useTasksDataStore();
  const [tasks, setTasks] = useState<Task[]>(initialTasks ?? []);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    setTasks(initialTasks ?? []);
  }, [initialTasks]);

  const statusOrder: Status[] = [
    "Start ausstehend",
    "Zu Erledigen",
    "In Bearbeitung",
    "Blockiert",
    "Erledigt",
  ];

  const tasksById = useMemo(() => {
    const map = new Map<string, Task>();
    tasks.forEach((task) => {
      map.set(task.taskId, task);
    });
    return map;
  }, [tasks]);

  const groupedTasks = useMemo(() => {
    const grouped: Record<Status, Task[]> = {
      "Start ausstehend": [],
      "Zu Erledigen": [],
      "In Bearbeitung": [],
      Blockiert: [],
      Erledigt: [],
    };
    tasks.forEach((task) => {
      if (grouped[task.status]) grouped[task.status].push(task);
    });
    return grouped;
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveTask(tasksById.get(active.id as string) || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) return;

    const activeTask = tasksById.get(active.id as string);
    if (!activeTask) return;

    const overIsColumn = over.data.current?.type === "Column";
    const overIsTask = over.data.current?.type === "Task";

    if (active.id === over.id) return;

    // Scenario 1: Reordering tasks within the same column
    if (overIsTask && activeTask.status === over.data.current?.task.status) {
      const oldIndex = tasks.findIndex((t) => t.taskId === active.id);
      const newIndex = tasks.findIndex((t) => t.taskId === over.id);
      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      setTasks(newTasks);
      updateTasks(newTasks, "update");
      return;
    }

    // Scenario 2: Moving a task to a different column
    let newStatus: Status | undefined;
    if (overIsColumn) newStatus = over.id as Status;
    if (overIsTask) newStatus = over.data.current?.task.status;

    if (newStatus && activeTask.status !== newStatus) {
      const newTasks = tasks.map((t) =>
        t.taskId === active.id ? { ...t, status: newStatus } : t
      );
      setTasks(newTasks);
      updateTasks(newTasks, "update");
    }
  };

  return (
    <DndContext
      sensors={sensors}
      // THE FIX: Change the collision detection strategy
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-5 gap-5 p-5">
        {statusOrder.map((status) => (
          <Column
            key={status}
            id={status}
            status={status}
            tasks={groupedTasks[status] ?? []}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <SortableTask task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanView;
