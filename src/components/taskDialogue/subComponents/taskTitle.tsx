import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-dropdown-menu";

export default function TaskTitle() {
  return (
    <div className="flex flex-col gap-2">
      <Label className="opacity-75 text-sm font-medium">Titel</Label>
      <Input placeholder="Titel der Aufgabe..." className="" />
      <p className="text-red-500 text-sm">Dieses Feld darf nicht leer sein!</p>
    </div>
  );
}
