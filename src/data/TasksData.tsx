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
    status: "Erledigt",
    createdAt: new Date("2025-05-30T09:30:00Z"),
  },
  {
    taskId: "Task-004",
    title: "Benutzerschnittstelle überarbeiten",
    label: "Feature",
    isFavorite: false,
    priority: "Hoch",
    status: "In Bearbeitung",
    createdAt: new Date("2025-06-01T15:00:00Z"),
  },
  {
    taskId: "Task-005",
    title: "Neue Benutzerrolle hinzufügen",
    label: "Feature",
    isFavorite: false,
    priority: "Kritisch",
    status: "Zu Erledigen",
    createdAt: new Date("2025-06-05T10:00:00Z"),
  },
  {
    taskId: "Task-006",
    title: "Benutzerdatenbank optimieren",
    label: "Feature",
    isFavorite: true,
    priority: "Hoch",
    status: "In Bearbeitung",
    createdAt: new Date("2025-06-10T12:00:00Z"),
  },
  {
    taskId: "Task-007",
    title: "Neue Funktion für Benutzerschnittstelle",
    label: "Feature",
    isFavorite: false,
    priority: "Mittel",
    status: "Zu Erledigen",
    createdAt: new Date("2025-06-15T14:00:00Z"),
  },
  {
    taskId: "Task-008",
    title: "Benutzerschnittstelle für Mobilgeräte anpassen",
    label: "Feature",
    isFavorite: true,
    priority: "Kritisch",
    status: "In Bearbeitung",
    createdAt: new Date("2025-06-20T16:00:00Z"),
  },
  {
    taskId: "Task-009",
    title: "Benutzerhandbuch aktualisieren",
    label: "Dokumentation",
    isFavorite: false,
    priority: "Niedrig",
    status: "Erledigt",
    createdAt: new Date("2025-06-25T10:00:00Z"),
  },
  {
    taskId: "Task-010",
    title: "Neue Sicherheitsfunktion implementieren",
    label: "Feature",
    isFavorite: true,
    priority: "Hoch",
    status: "In Bearbeitung",
    createdAt: new Date("2025-07-01T12:00:00Z"),
  },
];
