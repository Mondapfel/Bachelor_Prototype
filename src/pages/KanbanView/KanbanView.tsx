import {
  DndContext,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
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

  const groupedTasks = useMemo(() => {
    const grouped: Record<Status, Task[]> = {
      "Start ausstehend": [],
      "Zu Erledigen": [],
      "In Bearbeitung": [],
      Blockiert: [],
      Erledigt: [],
    };
    (tasks ?? []).forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
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
    const task = tasks.find((t) => t.taskId === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTask = tasks.find((t) => t.taskId === activeId);
    if (!activeTask) return;

    // Determine the new status based on what the task was dropped on
    let newStatus: Status | undefined;
    if (over.data.current?.type === "Column") {
      newStatus = overId as Status;
    } else {
      const overTask = tasks.find((t) => t.taskId === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (!newStatus) return;

    // Determine if we are reordering or changing status
    const isChangingColumn = activeTask.status !== newStatus;
    const isReorderingInSameColumn =
      over.data.current?.type === "Task" && !isChangingColumn;

    let newTasks = tasks;

    // Handle both status change and reordering
    if (isChangingColumn) {
      newTasks = newTasks.map((t) =>
        t.taskId === activeId ? { ...t, status: newStatus } : t
      );
    }

    if (isReorderingInSameColumn && active.id !== over.id) {
      const oldIndex = newTasks.findIndex((t) => t.taskId === activeId);
      const newIndex = newTasks.findIndex((t) => t.taskId === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        newTasks = arrayMove(newTasks, oldIndex, newIndex);
      }
    }

    // Apply the final state and persist it
    setTasks(newTasks);
    updateTasks(newTasks, "update");
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
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
