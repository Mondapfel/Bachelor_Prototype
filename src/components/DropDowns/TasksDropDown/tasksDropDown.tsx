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

export function TaskDropDown({
  onOpen,
  onClose,
}: {
  onOpen: () => void;
  onClose: () => void;
}) {
  // selected label
  const [selectedLabel, setSelectedLabel] = useState("Fehler");

  //selected task
  const { selectedTask } = useTasksDataStore();

  //menu items array state
  const [menuItemsArray, setMenuItemsArray] =
    useState<MenuItemType[]>(MENU_ITEMS);

  useEffect(() => {
    setMenuItemsArray((prev) =>
      prev.map((item) => {
        if (item.kind === "favorite") {
          return {
            ...item,
            label: selectedTask?.isFavorite ? "Favorit entfernen" : "Favorisieren",
          };
        }
        return item;
      })
    );
  }, [selectedTask]);

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
              Icon={item.icon}
              label={item.label}
              shortcut={item.shortcut}
            />
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <LabelSubMenu
            value={selectedLabel}
            onValueChange={setSelectedLabel}
          />
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <MenuItem
          Icon={Trash2}
          label="Löschen"
          shortcut="Strg + Q"
          className="text-red-500"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
