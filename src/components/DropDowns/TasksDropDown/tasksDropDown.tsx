import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ellipsis, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { MENU_ITEMS } from "./constants";
import { MenuItem } from "./menuItems";
import { LabelSubMenu } from "./subLabelMenu";
import { useTasksDataStore } from "@/hooks/useTasksDataStore";
import type { MenuItemType } from "./types";
import type { Label, Task } from "@/data/TasksData";
import { toast } from "sonner";

export function TaskDropDown({
  task,
  onOpenChange,
}: {
  task: Task;
  onOpenChange?: (open: boolean) => void;
}) {
  const [selectedLabel, setSelectedLabel] = useState<Label>(task.label);
  const { tasks, updateTasks } = useTasksDataStore();
  const [menuItemsArray, setMenuItemsArray] =
    useState<MenuItemType[]>(MENU_ITEMS);

  useEffect(() => {
    setMenuItemsArray((prev) =>
      prev.map((item) => {
        if (item.kind === "favorite") {
          return {
            ...item,
            label: task.isFavorite ? "Favorit entfernen" : "Favorisieren",
          };
        }
        return item;
      })
    );
  }, [task]);

  useEffect(() => {
    if (task) {
      setSelectedLabel(task.label);
    }
  }, [task]);

  const clickedLabelItem = async (newLabel: Label) => {
    if (task && tasks) {
      const updatedTask: Task = { ...task, label: newLabel };
      const updateTasksArray = tasks.map((t) =>
        t.taskId === task.taskId ? updatedTask : t
      );
      try {
        const result = await updateTasks(updateTasksArray, "update");
        toast[result.success ? "success" : "error"](
          result.success
            ? `[${task.taskId}] wurde erfolgreich aktualisiert!`
            : `Aufgabe aktualisieren fehlgeschlagen`
        );
      } catch (error) {
        console.error("Failed to update tasks:", error);
      }
    }
  };

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
        >
          <Ellipsis className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuGroup>
          {menuItemsArray.map((item) => (
            <MenuItem
              key={item.label}
              kind={item.kind}
              Icon={item.icon}
              label={item.label}
              shortcut={item.shortcut}
              task={task}
            />
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <LabelSubMenu
            onClickedLabelItem={clickedLabelItem}
            value={selectedLabel}
            onValueChange={setSelectedLabel}
          />
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <MenuItem
          Icon={Trash2}
          kind="delete"
          label="Löschen"
          shortcut=""
          className="text-red-500"
          task={task}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}