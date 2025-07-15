import {
  DropdownMenuItem,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { useTasksDataStore } from "@/hooks/useTasksDataStore";
import type { LucideIcon } from "lucide-react";
import { handleMenuItemClick } from "./utils";
import type { Kind } from "./types";
import { useOpenDialogStore } from "@/hooks/useOpenDialogStore";
import { type Task } from "@/data/TasksData";

export function MenuItem({
  Icon,
  kind,
  label,
  shortcut,
  className,
  task,
}: {
  Icon: LucideIcon;
  kind: Kind;
  label: string;
  shortcut: string;
  className?: string;
  task: Task;
}) {
  const { tasks, updateTasks, setSelectedTask } = useTasksDataStore();
  const { setIsOpen } = useOpenDialogStore();

  return (
    <DropdownMenuItem
      onClick={() => {
        if (kind === 'edit') {
            setSelectedTask(task);
        }
        handleMenuItemClick(kind, task, tasks, updateTasks, setIsOpen);
      }}
    >
      <Icon className={`mr-2 h-4 w-4 ${className}`} />
      <span className={`${className}`}>{label}</span>
      {shortcut && (
        <DropdownMenuShortcut className={`${className}`}>
          {shortcut}
        </DropdownMenuShortcut>
      )}
    </DropdownMenuItem>
  );
}