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

import {
  CircleCheckBig,
  Circle,
  CircleDashed,
  CircleOff,
  CircleFadingArrowUp,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { useCheckedStatusesStore } from "@/hooks/useCheckedStatusStore";
import { type Status } from "@/data/TasksData";
import { useTasksDataStore } from "@/hooks/useTasksDataStore";

type SingleStatusItem = {
  value: string;
  label: string;
  icon: LucideIcon;
  count: number;
};

const statusesArray: SingleStatusItem[] = [
  {
    value: "startAusstehend",
    label: "Start ausstehend",
    icon: CircleDashed,
    count: 0,
  },
  {
    value: "zuErledigen",
    label: "Zu Erledigen",
    icon: Circle,
    count: 0,
  },
  {
    value: "inBearbeitung",
    label: "In Bearbeitung",
    icon: CircleFadingArrowUp,
    count: 0,
  },
  {
    value: "erledigt",
    label: "Erledigt",
    icon: CircleCheckBig,
    count: 0,
  },
  {
    value: "blockiert",
    label: "Blockiert",
    icon: CircleOff,
    count: 0,
  },
];

export function StatusDropDown() {
  const [open, setOpen] = React.useState(false);
  const { checkedStatuses, setCheckedStatuses } = useCheckedStatusesStore();

  const { tasks } = useTasksDataStore();

  function updateCheckedStatus(label: string) {
    const validStatuses: Status[] = [
      "Start ausstehend",
      "Zu Erledigen",
      "In Bearbeitung",
      "Erledigt",
      "Blockiert",
    ];

    if (!validStatuses.includes(label as Status)) {
      console.error(`The type ${label} does not match the status types!`);
      return;
    }

    const castedStatus = label as Status;

    const newCheckedStatuses: Status[] = checkedStatuses.includes(
      castedStatus as Status
    )
      ? checkedStatuses.filter((s) => s !== castedStatus)
      : [...checkedStatuses, castedStatus];

    setCheckedStatuses(newCheckedStatuses);
  }

  const countStatuses: SingleStatusItem[] = React.useMemo(() => {
    if (!tasks) return statusesArray;

    return statusesArray.map((status) => {
      switch (status.value) {
        case "startAusstehend":
          return {
            ...status,
            count: tasks.filter((task) => task.status === "Start ausstehend")
              .length,
          };
        case "zuErledigen":
          return {
            ...status,
            count: tasks.filter((task) => task.status === "Zu Erledigen")
              .length,
          };
        case "inBearbeitung":
          return {
            ...status,
            count: tasks.filter((task) => task.status === "In Bearbeitung")
              .length,
          };
        case "erledigt":
          return {
            ...status,
            count: tasks.filter((task) => task.status === "Erledigt").length,
          };
        case "blockiert":
          return {
            ...status,
            count: tasks.filter((task) => task.status === "Blockiert").length,
          };

        default:
          return status;
      }
    });
  }, [tasks]);

  function ShowCheckedStatuses() {
    // get the length of items checked
    const checkedStatusesLength = checkedStatuses.length;

    //if it is more than 0
    if (checkedStatusesLength > 0) {
      //see if there's less than two elements, show the two tags checked
      if (checkedStatusesLength <= 2) {
        return (
          <>
            {/* Separator */}
            <Separator
              orientation="vertical"
              className="h-6 border-l border-gray-300"
            />

            {/* Badges */}
            <div className="flex items-center gap-2">
              {checkedStatuses.map((status, index) => (
                <Badge key={index} variant={"secondary"}>
                  {status}
                </Badge>
              ))}
            </div>
          </>
        );
      } else {
        // when it is more than 3 items, show 3 selected
        return <Badge variant={"secondary"}>3+</Badge>;
      }
    }
  }

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

              <ShowCheckedStatuses />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-52" side="bottom" align="center">
          <Command>
            <CommandInput placeholder="Priorität ändern" />
            <CommandList>
              <CommandEmpty>Keine Ergebnisse</CommandEmpty>
              <CommandGroup>
                {countStatuses.map((status) => (
                  <CommandItem
                    key={status.value}
                    value={status.value}
                    className="flex justify-between"
                    onSelect={() => updateCheckedStatus(status.label)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={checkedStatuses.includes(
                          status.label as Status
                        )}
                      />

                      <status.icon />
                      <span>{status.label}</span>
                    </div>
                    <pre>{status.count}</pre>
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
