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
import { useState } from "react";

type Label = {
  value: Task["label"];
};

const statuses: Label[] = [
  { value: "Dokumentation" },
  { value: "Feature" },
  { value: "Bug" },
];

export default function TaskLabels() {
  const [selectedStatus, setSelectedStatus] = useState<Task["label"]>("Bug");
  return (
    <div className="flex flex-col gap-2">
      <Label className="opacity-75 text-sm font-medium">Label</Label>
      <Select
        value={selectedStatus}
        onValueChange={(value: Task["label"]) => {
          setSelectedStatus(value);
        }}
      >
        <SelectTrigger className="w-full h-11">
          <SelectValue placeholder="Label..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {statuses.map((status, index) => (
              <SelectItem key={index} value={status.value}>
                <div className="flex items-center gap-2">
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
