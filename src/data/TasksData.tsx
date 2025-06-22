export type Label = "Dokumentation" | "Bug" | "Feature";
export type Priority = "Niedrig" | "Mittel" | "Hoch" | "Kritisch";
export type Status =
  | "Start ausstehend"
  | "Zu Erledigen"
  | "In Bearbeitung"
  | "Erledigt"
  | "Blockiert";

export type Task = {
  taskId: string;
  title: string;
  label: Label;
  isFavorite: boolean;
  priority: Priority;
  status: Status;
  createdAt: Date;
};

export const tasks: Task[] = [
  {
    taskId: "Task-001",
    title: "Fehler beim Einloggen beheben",
    label: "Bug",
    isFavorite: true,
    priority: "Hoch",
    status: "In Bearbeitung",
    createdAt: new Date("2025-01-21T10:00:00Z"),
  },
  {
    taskId: "Task-002",
    title: "Neues Farbschema hinzufügen",
    label: "Feature",
    isFavorite: false,
    priority: "Mittel",
    status: "Zu Erledigen",
    createdAt: new Date("2025-01-02T12:00:00Z"),
  },
  {
    taskId: "Task-003",
    title: "Architektur dokumentieren",
    label: "Dokumentation",
    isFavorite: false,
    priority: "Niedrig",
    status: "In Bearbeitung",
    createdAt: new Date("2025-05-30T09:30:00Z"),
  },
];
