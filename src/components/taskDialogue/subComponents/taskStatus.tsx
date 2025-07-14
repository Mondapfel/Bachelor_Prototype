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
import { Controller, useFormContext } from "react-hook-form";
import type { taskFormData } from "../taskDialogSchema";

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
  const { control } = useFormContext<taskFormData>();
  return (
    <div className="flex flex-col gap-2">
      <Label className="opacity-75 text-sm font-medium">Status</Label>
      <Controller
        name="status"
        control={control}
        render={({ field }) => {
          return (
            <Select
              value={field.value}
              onValueChange={(value: taskFormData["status"]) => {
                field.onChange(value);
              }}
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Status wählen..." />
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
          );
        }}
      />
    </div>
  );
}
