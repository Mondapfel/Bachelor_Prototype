export type Field = "Title" | "Requester" | "Assignee" | "Priority" | "Due Date" | "Status";

export interface Task {
  id: string;
  title: string;
  [key: string]: string;
}

export const DATA: Task[] = [
  { id: "1", title: "Design homepage", Deadline: "2025-06-20" },
  { id: "2", title: "Write blog post", Priority: "High" },
  { id: "3", title: "Fix login bug", Priority: "Low", Assignee: "Alice" },
];

export interface TaskGroup {
  id: string;
  name: string;
  tasks: Task[];
  collapsed: boolean;
}
