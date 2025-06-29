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
  ArrowBigDown,
  ArrowBigUp,
  ShieldAlert,
  ChevronsLeftRightEllipsis,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { useCheckedPrioritiesStore } from "@/hooks/useCheckedPrioritiesStore";
import { type Priority } from "@/data/TasksData";
import { useTasksDataStore } from "@/hooks/useTasksDataStore";

type SinglePriorityItem = {
  value: string;
  label: string;
  icon: LucideIcon;
  count: number;
};

const prioritiesArray: SinglePriorityItem[] = [
  { value: "niedrig", label: "Niedrig", icon: ArrowBigDown, count: 0 },
  {
    value: "mittel",
    label: "Mittel",
    icon: ChevronsLeftRightEllipsis,
    count: 0,
  },
  { value: "hoch", label: "Hoch", icon: ArrowBigUp, count: 0 },
  { value: "kritisch", label: "Kritisch", icon: ShieldAlert, count: 0 },
];

export function PriorityDropDown() {
  const [open, setOpen] = React.useState(false);
  const { checkedPriorities, setCheckedPriorities } =
    useCheckedPrioritiesStore();

  const { tasks } = useTasksDataStore();

  function updateSelection(label: string) {
    const validPriorities: Priority[] = [
      "Niedrig",
      "Mittel",
      "Hoch",
      "Kritisch",
    ];

    if (!validPriorities.includes(label as Priority)) {
      console.error("Invalid Priority type");
      return;
    }

    const priority = label as Priority;

    const newCheckedPriorities = checkedPriorities.includes(priority)
      ? checkedPriorities.filter((p) => p !== priority)
      : [...checkedPriorities, priority];

    setCheckedPriorities(newCheckedPriorities);
  }

  const priorityCounts: SinglePriorityItem[] = React.useMemo(() => {
    //if the tasks is null, return prioritiesArray
    if (!tasks) {
      return prioritiesArray;
    }

    //count the priorities of low, medium, and high
    const countByLow = tasks?.filter(
      (task) => task.priority === "Niedrig"
    ).length;
    const countByMedium = tasks?.filter(
      (task) => task.priority === "Mittel"
    ).length;
    const countByHigh = tasks?.filter(
      (task) => task.priority === "Hoch"
    ).length;
    const countByCritical = tasks?.filter(
      (task) => task.priority === "Kritisch"
    ).length;

    //update the count property of the statusArray based on the priority
    //and return it
    return prioritiesArray.map((priority) => {
      switch (priority.value) {
        case "niedrig":
          return { ...priority, count: countByLow };
        case "mittel":
          return { ...priority, count: countByMedium };
        case "hoch":
          return { ...priority, count: countByHigh };
        case "kritisch":
          return { ...priority, count: countByCritical };

        default:
          return priority;
      }
    });
  }, [tasks]);

  return (
    <div className="flex items-center space-x-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            disabled={!tasks}
            variant={"outline"}
            className="h-10 justify-start border-dashed px-5"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Plus />
                <span>Priorität</span>
              </div>

              {checkedPriorities?.length > 0 && (
                <>
                  <Separator
                    orientation="vertical"
                    className="h-6 border-l border-gray-300"
                  />
                  <div className="flex items-center gap-2">
                    {checkedPriorities.map((checkPriority, index) => (
                      <Badge key={index} variant={"secondary"}>
                        {checkPriority}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-52" side="bottom" align="center">
          <Command>
            <CommandInput placeholder="Priorität ändern" />
            <CommandList>
              <CommandEmpty>Keine Ergebnisse</CommandEmpty>
              <CommandGroup>
                {priorityCounts.map((priority) => (
                  <CommandItem
                    key={priority.value}
                    value={priority.value}
                    className="flex justify-between"
                    onSelect={() => updateSelection(priority.label)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={checkedPriorities.includes(
                          priority.label as Priority
                        )}
                      />
                      <priority.icon />
                      <span>{priority.label}</span>
                    </div>
                    <pre>{priority.count}</pre>
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
