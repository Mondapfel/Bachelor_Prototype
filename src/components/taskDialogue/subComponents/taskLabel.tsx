import {
  SelectValue,
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Controller, useFormContext } from "react-hook-form";
import { type taskFormData, labels } from "../taskDialogSchema";

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
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="w-full h-11">
              <SelectValue placeholder="Label wählen..." />
            </SelectTrigger>
            <SelectContent>
              {labels.map((label) => (
                <SelectItem key={label} value={label}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {errors.label && (
        <p className="text-red-500 text-sm">{errors.label.message}</p>
      )}
    </div>
  );
}
