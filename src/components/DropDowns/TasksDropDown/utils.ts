import type { Task } from "@/data/TasksData";
import type { useTasksDataStoreInterface } from "@/hooks/useTasksDataStore";
import { toast } from "sonner";

import type { Kind } from "./types";

function generateRandomThreeDigitNumber(): string {
  const randomNumber = Math.floor(Math.random() *900) +100;
  return randomNumber.toString();
}

export async function handleMenuItemClick(
  kind: Kind,
  tasks: Task[] | null,
  selectedTask: Task | null,
  updateTasks: useTasksDataStoreInterface["updateTasks"],
  setIsOpen: (isOpen: boolean) => void
) {
  if (!tasks || !selectedTask) return;

  switch (kind) {
    case "edit":
      // open the dialog
      setIsOpen(true);
      break;
    case "favorite":
      const taskToUpdate: Task = {
        ...selectedTask,
        isFavorite: !selectedTask.isFavorite,
      };
      const updateTasksArray = tasks.map((task) =>
        task.taskId === selectedTask.taskId ? taskToUpdate : task
      );
      const favoriteResult = await updateTasks(updateTasksArray);
      if (!favoriteResult.success) {
        console.log("failed")
        toast.error("Etwas ist schiefgelaufen!",
        );
      } else {
        toast.info("Aufgabe auktualisiert!");
        
      }
        

      break;
      
    case "copy":
      const copiedTask: Task = {
        ...selectedTask,
        taskId: `task-${generateRandomThreeDigitNumber()}`,
        title: `${selectedTask.title} (Kopie)`,
        createdAt: new Date(),
      };
      const addCopiedTask = [...tasks, copiedTask];
      const result = await updateTasks(addCopiedTask, "copy");
      toast[result ? "success" : "error"](
          result
            ? `[${selectedTask.taskId}] dupliziert!`
            : `Aufgabe duplizieren fehlgeschlagen`,
            {description: result.message}
        );

      break;

    case "delete":
      const deleteTasksArray = tasks.filter(
        (task) => task.taskId !== selectedTask.taskId
      );
      const deleteResult = await updateTasks(deleteTasksArray, "delete");
      toast[deleteResult ? "success" : "error"](
          deleteResult
            ? `[${selectedTask.taskId}] gelöscht!`
            : `Aufgabe löschen fehlgeschlagen`,
            {description: deleteResult.message}
        );
      
      break;
      

    default:
      break;
  }
}
