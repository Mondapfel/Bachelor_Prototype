import {
  DropdownMenuItem,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { useTasksDataStore } from "@/hooks/useTasksDataStore";
import type { LucideIcon } from "lucide-react";
import { handleMenuItemClick } from "./utils";
import type { Kind } from "./types";

export function MenuItem({
  Icon,
  kind,
  label,
  shortcut,
  className,
}: {
  Icon: LucideIcon;
  kind: Kind;
  label: string;
  shortcut: string;
  className?: string;
}) {
  const { tasks, selectedTask, updateTasks } = useTasksDataStore();
  return (
    <DropdownMenuItem
      onClick={() =>
        handleMenuItemClick(kind, tasks, selectedTask, updateTasks)
      }
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
