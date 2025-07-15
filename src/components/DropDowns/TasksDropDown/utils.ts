import type { Task } from "@/data/TasksData";
import type { useTasksDataStoreInterface } from "@/hooks/useTasksDataStore";
import { toast } from "sonner";
import type { Kind } from "./types";

function generateRandomThreeDigitNumber(): string {
  const randomNumber = Math.floor(Math.random() * 900) + 100;
  return randomNumber.toString();
}

export async function handleMenuItemClick(
  kind: Kind,
  task: Task,
  tasks: Task[] | null,
  updateTasks: useTasksDataStoreInterface["updateTasks"],
  setIsOpen: (isOpen: boolean) => void
) {
  if (!tasks) return;

  switch (kind) {
    case "edit":
      setIsOpen(true);
      break;
    case "favorite":
      const taskToUpdate: Task = {
        ...task,
        isFavorite: !task.isFavorite,
      };
      const updateTasksArray = tasks.map((t) =>
        t.taskId === task.taskId ? taskToUpdate : t
      );
      const favoriteResult = await updateTasks(updateTasksArray, "favorite");
      if (favoriteResult.success) {
        toast.info("Aufgabe aktualisiert!");
      } else {
        toast.error("Etwas ist schiefgelaufen!");
      }
      break;

    case "copy":
      const copiedTask: Task = {
        ...task,
        taskId: `task-${generateRandomThreeDigitNumber()}`,
        title: `${task.title} (Kopie)`,
        createdAt: new Date(),
      };
      const addCopiedTask = [...tasks, copiedTask];
      const result = await updateTasks(addCopiedTask, "copy");
      toast[result.success ? "success" : "error"](
        result.success
          ? `[${task.taskId}] dupliziert!`
          : `Aufgabe duplizieren fehlgeschlagen`,
        { description: result.message }
      );
      break;

    case "delete":
      const deleteTasksArray = tasks.filter((t) => t.taskId !== task.taskId);
      const deleteResult = await updateTasks(deleteTasksArray, "delete");
      toast[deleteResult.success ? "success" : "error"](
        deleteResult.success
          ? `[${task.taskId}] gelöscht!`
          : `Aufgabe löschen fehlgeschlagen`,
        { description: deleteResult.message }
      );
      break;

    default:
      break;
  }
}