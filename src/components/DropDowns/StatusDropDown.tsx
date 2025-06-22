import * as React from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "../ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { type IconType } from "react-icons/lib";
import {
  CircleCheckBig,
  Circle,
  CircleDashed,
  CircleOff,
  CircleFadingArrowUp,
  Plus,
} from "lucide-react";

type Status = {
  value: string;
  label: string;
  icon: IconType;
};

const statuses: Status[] = [
  { value: "startAusstehend", label: "Start ausstehend", icon: CircleDashed },
  { value: "zuErledigen", label: "Zu Erledigen", icon: Circle },
  { value: "inBearbeitung", label: "In Bearbeitung", icon: CircleFadingArrowUp},
  { value: "erledigt", label: "Erledigt", icon: CircleCheckBig },
  { value: "blockiert", label: "Blockiert", icon: CircleOff },
];

export function StatusDropDown() {
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);

  console.log(selectedStatus);

  return (
    <div className="flex items-center space-x-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={"outline"}
            className="h-10 justify-start border-dashed px-5"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Plus />
                <span>Status</span>
              </div>

              <Separator
                orientation="vertical"
                className="h-6 border-1 border-gray-300"
              />

              <div className="flex items-center gap-2">
                <Badge variant={"secondary"}>Zu Erledigen</Badge>
                <Badge variant={"secondary"}>Erledigt</Badge>
              </div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-52" side="bottom" align="center">
          <Command>
            <CommandInput placeholder="Priorität ändern" />
            <CommandList>
              <CommandEmpty>Keine Ergebnisse</CommandEmpty>
              <CommandGroup>
                {statuses.map((status) => (
                  <CommandItem
                    key={status.value}
                    value={status.value}
                    className="flex justify-between"
                    onSelect={(value) => {
                      setSelectedStatus(
                        statuses.find((priority) => priority.value === value) ||
                          null
                      );
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox />

                      <status.icon />
                      <span>{status.label}</span>
                    </div>
                    <span>7</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
