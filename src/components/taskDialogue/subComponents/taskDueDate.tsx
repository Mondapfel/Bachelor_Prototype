import { Controller, useFormContext } from "react-hook-form";
import { Label } from "@radix-ui/react-dropdown-menu";
import { DatePicker } from "@/components/ui/datePicker";

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
          <DatePicker value={field.value} onChange={field.onChange} />
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
