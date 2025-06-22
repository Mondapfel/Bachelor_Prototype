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
  ArrowBigDown,
  ChevronsLeftRightEllipsis,
  ArrowBigUp,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import type { IconType } from "react-icons/lib";

type Priority = {
  value: Task["priority"];
  icon: IconType;
};

const statuses: Priority[] = [
  { value: "Niedrig", icon: ArrowBigDown },
  { value: "Mittel", icon: ChevronsLeftRightEllipsis },
  { value: "Hoch", icon: ArrowBigUp },
  { value: "Kritisch", icon: ShieldAlert },
];

export default function TaskPriority() {
  const [selectedStatus, setSelectedStatus] =
    useState<Task["priority"]>("Niedrig");
  return (
    <div className="flex flex-col gap-2">
      <Label className="opacity-75 text-sm font-medium">Priorität</Label>
      <Select
        value={selectedStatus}
        onValueChange={(value: Task["priority"]) => {
          setSelectedStatus(value);
        }}
      >
        <SelectTrigger className="w-full h-11">
          <SelectValue placeholder="Priorität..." />
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
