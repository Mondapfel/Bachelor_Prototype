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
import { _success } from "zod/v4/core";

export function TaskDropDown({
  onOpen,
  onClose,
}: {
  onOpen: () => void;
  onClose: () => void;
}) {
  // selected label
  const [selectedLabel, setSelectedLabel] = useState("Bug");

  //selected task
  const { selectedTask, updateTasks } = useTasksDataStore();
  const { tasks } = useTasksDataStore();

  //menu items array state
  const [menuItemsArray, setMenuItemsArray] =
    useState<MenuItemType[]>(MENU_ITEMS);

  useEffect(() => {
    setMenuItemsArray((prev) =>
      prev.map((item) => {
        if (item.kind === "favorite") {
          return {
            ...item,
            label: selectedTask?.isFavorite
              ? "Favorit entfernen"
              : "Favorisieren",
          };
        }
        return item;
      })
    );
  }, [selectedTask]);

  useEffect(() => {
    if (selectedTask) {
      setSelectedLabel(selectedTask.label);
    }
  }, [selectedTask]);

  const clickedLabelItem = async (newLabel: string) => {
    const validLabels: Label[] = ["Bug", "Feature", "Dokumentation"];
    if (!validLabels.includes(newLabel as Label)) {
      console.error(`Der Typ ${newLabel} ist nicht zulässig`);
      return;
    }

    if (selectedTask && tasks) {
      const updatedTask: Task = {
        ...selectedTask,
        label: newLabel as Label,
      };

      const updateTasksArray = tasks.map((task) =>
        task.taskId === selectedTask.taskId ? updatedTask : task
      );

      try {
        const result = await updateTasks(updateTasksArray);
        toast[result ? "success" : "error"](
          result
            ? `[${selectedTask.taskId}] wurde erfolgreich aktualisiert!`
            : `Aufgabe aktualisieren fehlgeschlagen`
        );
      } catch (error) {
        console.error("Failed to update tasks:", error);
      }
    }
  };

  return (
    <DropdownMenu
      onOpenChange={(open: boolean) => (open ? onOpen() : onClose())}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56">
        <DropdownMenuGroup>
          {menuItemsArray.map((item) => (
            <MenuItem
              key={item.label}
              kind={item.kind}
              Icon={item.icon}
              label={item.label}
              shortcut={item.shortcut}
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
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
