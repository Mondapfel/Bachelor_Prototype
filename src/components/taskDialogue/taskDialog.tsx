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
import { type taskFormData, taskFormSchema } from "./taskDialogSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useOpenDialogStore } from "@/hooks/useOpenDialogStore";
import { useEffect, useState } from "react";
import { useTasksDataStore } from "@/hooks/useTasksDataStore";
import { type Task } from "@/data/TasksData";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TaskDialog() {
  const { addTask, selectedTask, setSelectedTask, updateTasks, tasks } =
    useTasksDataStore();

  const methods = useForm<taskFormData>({
    resolver: zodResolver(taskFormSchema),
  });

  const { handleSubmit, reset, setValue } = methods;
  const { isOpen, setIsOpen } = useOpenDialogStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && selectedTask) {
      // Update form values when a task is selected and dialog is open
      setValue("title", selectedTask.title);
      setValue("status", selectedTask.status);
      setValue("priority", selectedTask.priority);
      setValue("label", selectedTask.label);
    }
  }, [isOpen, selectedTask, setValue]);

  const onSubmit = async (data: taskFormData) => {
    setIsLoading(true);

    if (!selectedTask) {
      const newTask: Task = {
        taskId: `Task-${generateRandomThreeDigitNumber()}`,
        title: data.title,
        status: data.status,
        priority: data.priority,
        label: data.label,
        isFavorite: false,
        createdAt: new Date(),
      };

      try {
        const result = await addTask(newTask);
        toast[result ? "success" : "error"](
          result
            ? `Die Aufgabe [${newTask.taskId}] wurde erfolgreich hinzugefügt!`
            : `Aufgabe hinzufügen fehlgeschlagen`
        );

        reset();
        setIsOpen(false);
      } catch (error) {
        console.log(error);

        toast.error("Aufgabe hinzufügen fehlgeschlagen");
      } finally {
        setIsLoading(false);
      }
    } else {
      const updateTasksArray = tasks?.map((t) => {
        if (t.taskId === selectedTask.taskId) {
          return {
            ...t,
            title: data.title,
            label: data.label,
            priority: data.priority,
            status: data.status,
          };
        }

        return t;
      });

      if (updateTasksArray) {
        const result = await updateTasks(updateTasksArray, "copy");
        // Add toast
      }

      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setSelectedTask(null);
          reset({ title: "" });
        }
        setIsOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-violet-400 dark:bg-blue-950 dark:text-white">
          Neue Aufgabe hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {selectedTask ? "Aufgabe bearbeiten" : "Aufgabe hinzufügen"}
          </DialogTitle>
          <DialogDescription>
            Füllen Sie alle Felder aus, um eine neue Aufgabe hinzuzufügen.
          </DialogDescription>
          <div className="mt-4">
            <Separator className="mt-3" />
          </div>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
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
            <DialogFooter className="mb-4">
              <DialogClose asChild>
                <Button type="button" variant="secondary" className="px-9">
                  Abbrechen
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {selectedTask
                      ? "Aufgabe wird aktualisiert..."
                      : "Aufgabe wird hinzugefügt..."}
                  </>
                ) : selectedTask ? (
                  "Aufgabe aktualisieren"
                ) : (
                  "Aufgabe hinzufügen"
                )}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

function generateRandomThreeDigitNumber(): string {
  const randomNumber = Math.floor(Math.random() * 900) + 100;
  return randomNumber.toString();
}
