import { Controller, useFormContext } from "react-hook-form";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Input } from "@/components/ui/input";

export default function TaskDueDate() {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="flex flex-col gap-2">
      <Label className="opacity-75 text-sm font-medium">Frist</Label>
      <Controller
        name="dueDate"
        control={control}
        render={({ field }) => (
          <Input
            type="date"
            className="h-11"
            value={
              field.value
                ? new Date(field.value).toISOString().split("T")[0]
                : ""
            }
            onChange={(e) => field.onChange(new Date(e.target.value))}
          />
        )}
      />
      {errors.dueDate && (
        <p className="text-red-500 text-sm">
          {(errors.dueDate as any).message}
        </p>
      )}
    </div>
  );
}
