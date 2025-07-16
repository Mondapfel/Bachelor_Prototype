import type { Row } from "@tanstack/react-table";
import type { Task } from "@/data/TasksData";

const priorityOrder = ["Kritisch", "Hoch", "Mittel", "Niedrig"];
const statusOrder = [
  "Start ausstehend",
  "Zu Erledigen",
  "In Bearbeitung",
  "Blockiert",
  "Erledigt",
];

export const prioritySortingFn = (rowA: Row<Task>, rowB: Row<Task>, columnId: string): number => {
  const priorityA = rowA.getValue(columnId) as string;
  const priorityB = rowB.getValue(columnId) as string;
  return priorityOrder.indexOf(priorityA) - priorityOrder.indexOf(priorityB);
};

export const statusSortingFn = (rowA: Row<Task>, rowB: Row<Task>, columnId: string): number => {
  const statusA = rowA.getValue(columnId) as string;
  const statusB = rowB.getValue(columnId) as string;
  return statusOrder.indexOf(statusA) - statusOrder.indexOf(statusB);
};