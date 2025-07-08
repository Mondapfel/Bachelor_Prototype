import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragAbortEvent,
  KeyboardSensor,
  PointerSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useTasksDataStore } from "@/hooks/useTasksDataStore";
import Column from "@/pages/KanbanView/Column";
import type { Task, Status } from "@/data/TasksData";
import { useState, type DragEvent } from "react";

const KanbanView = () => {
  const { tasks } = useTasksDataStore();

  const statusOrder: Status[] = [
    "Start ausstehend",
    "Zu Erledigen",
    "In Bearbeitung",
    "Blockiert",
    "Erledigt",
  ];

  const groupedTasks: Record<Status, Task[]> = {
    "Start ausstehend": [],
    "Zu Erledigen": [],
    "In Bearbeitung": [],
    Blockiert: [],
    Erledigt: [],
  };

  (tasks ?? []).forEach((task) => {
    groupedTasks[task.status].push(task);
  });

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  void activeId;
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragOver(event: DragOverEvent) {
    console.log("Drag over", event);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    console.log("Drag end", event);
  }

  return (
    <div className=" items-center gap-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-5 gap-5 p-5">
          {statusOrder.map((status) => (
            <Column key={status} status={status} tasks={groupedTasks[status]} />
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default KanbanView;
