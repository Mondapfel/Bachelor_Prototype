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
import { Controller, useFormContext } from "react-hook-form";
import { type taskFormData } from "../taskDialogSchema";

type Label = {
  value: Task["label"];
};

const statuses: Label[] = [
  { value: "Dokumentation" },
  { value: "Feature" },
  { value: "Bug" },
];

export default function TaskLabels() {
  const {
    control,
    formState: { errors },
  } = useFormContext<taskFormData>();
  return (
    <div className="flex flex-col gap-2">
      <Label className="opacity-75 text-sm font-medium">Label</Label>
      <Controller
        name="label"
        control={control}
        render={({ field }) => {
          return (
            <Select
              value={field.value}
              onValueChange={(value: taskFormData["label"]) => {
                field.onChange(value);
              }}
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Label wählen..." />
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
          );
        }}
      />
      {errors.label && (
        <p className="text-red-500 text-sm">{errors.label.message}</p>
      )}
    </div>
  );
}
