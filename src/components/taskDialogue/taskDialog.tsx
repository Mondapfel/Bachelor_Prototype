import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Separator } from "../ui/separator";
import TaskLabels from "./subComponents/taskLabel";
import TaskPriority from "./subComponents/taskPriority";
import TaskStatus from "./subComponents/taskStatus";
import TaskTitle from "./subComponents/taskTitle";

export default function TaskDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Neue Aufgabe anlegen</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Neue Aufgabe</DialogTitle>
          <DialogDescription>
            Füllen Sie alle Felder aus, um eine neue Aufgabe anzulegen.
          </DialogDescription>
          <div className="mt-4">
            <Separator className="mt-3" />
          </div>
        </DialogHeader>
        <div className="my-8">
          <div className="grid grid-cols-2 gap-5">
            <TaskTitle />
            <TaskStatus />
          </div>
          <div className="grid grid-cols-2 gap-5 mt-6">
            <TaskPriority />
            <TaskLabels />
          </div>
        </div>
        <DialogFooter className="mb-4 mt-9">
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="px-9">
              Abbrechen
            </Button>
          </DialogClose>
          <Button type="submit">Aufgabe hinzufügen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
