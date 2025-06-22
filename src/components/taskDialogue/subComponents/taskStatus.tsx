import {
  SelectValue,
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import type { Task } from "@/data/TasksData";
import { Label } from "@radix-ui/react-dropdown-menu";
import {
  Circle,
  CircleCheckBig,
  CircleDashed,
  CircleFadingArrowUp,
  CircleOff,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

type Status = {
  value: Task["status"];
  icon: LucideIcon;
};

const statuses: Status[] = [
  { value: "Start ausstehend", icon: CircleDashed },
  { value: "Zu Erledigen", icon: Circle },
  { value: "In Bearbeitung", icon: CircleFadingArrowUp },
  { value: "Erledigt", icon: CircleCheckBig },
  { value: "Blockiert", icon: CircleOff },
];

export default function TaskStatus() {
  const [selectedStatus, setSelectedStatus] =
    useState<Task["status"]>("Start ausstehend");
  return (
    <div className="flex flex-col gap-2">
      <Label className="opacity-75 text-sm font-medium">Status</Label>
      <Select
        value={selectedStatus}
        onValueChange={(value: Task["status"]) => {
          setSelectedStatus(value);
        }}
      >
        <SelectTrigger className="w-full h-11">
          <SelectValue placeholder="Status..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {statuses.map((status, index) => (
              <SelectItem key={index} value={status.value}>
                <div className="flex items-center gap-2">
                  <status.icon size={15} />
                  <span>{status.value}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
