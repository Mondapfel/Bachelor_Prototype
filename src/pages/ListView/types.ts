export type Field = "Title" | "Requester" | "Assignee" | "Priority" | "Due Date" | "Status";

export interface Task {
  id: string;
  title: string;
  [key: string]: string;
}

export interface TaskGroup {
  id: string;
  name: string;
  tasks: Task[];
  collapsed: boolean;
}
