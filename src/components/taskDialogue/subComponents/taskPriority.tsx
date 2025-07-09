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
import type { IconType } from "react-icons/lib";
import { Controller, useFormContext } from "react-hook-form";
import type { taskFormData } from "../taskDialogSchema";

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
  const { control } = useFormContext<taskFormData>();
  return (
    <div className="flex flex-col gap-2">
      <Label className="opacity-75 text-sm font-medium">Priorität</Label>
      <Controller
        name="priority"
        control={control}
        render={({ field }) => {
          return (
            <Select
              value={field.value}
              onValueChange={(value: taskFormData["priority"]) => {
                field.onChange(value);
              }}
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Priorität wählen..." />
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
