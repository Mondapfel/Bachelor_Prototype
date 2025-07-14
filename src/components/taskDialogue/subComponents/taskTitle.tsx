import { Label } from "@radix-ui/react-dropdown-menu";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";
import type { taskFormData } from "../taskDialogSchema";

export default function TaskTitle() {
  const {
    register,
    formState: { errors },
  } = useFormContext<taskFormData>();
  return (
    <div className="flex flex-col gap-2">
      <Label className="opacity-75 text-sm font-medium">Titel</Label>
      <Input
        placeholder="Titel der Aufgabe..."
        {...register("title")}
        className="h-9"
      />
      {errors.title && (
        <p className="text-red-500 text-sm">{errors.title.message}</p>
      )}
    </div>
  );
}
