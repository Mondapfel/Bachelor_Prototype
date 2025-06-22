import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ellipsis, Trash2 } from "lucide-react";
import { useState } from "react";
import { MENU_ITEMS } from "./constants";
import { MenuItem } from "./menuItems";
import { LabelSubMenu } from "./subLabelMenu";

export function TaskDropDown() {
  const [selectedLabel, setSelectedLabel] = useState("Fehler");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56">
        <DropdownMenuGroup>
          {MENU_ITEMS.map((item) => (
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
