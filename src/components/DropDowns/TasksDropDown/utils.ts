import type { Task } from "@/data/TasksData";
import type { useTasksDataStoreInterface } from "@/hooks/useTasksDataStore";

import type { Kind } from "./types";



export async function handleMenuItemClick(
  kind: Kind,
  tasks: Task[] | null,
  selectedTask: Task | null,
  updateTasks: useTasksDataStoreInterface["updateTasks"],
) {
  if (!tasks || !selectedTask) return;

  switch (kind) {
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
        /*
        toast({
          variant: "destructive",
          title: "Operation Failed!",
          description: "Something went wrong!",
        });
      } else {
        toast({
          variant: "default",
          title: "Task updated!",
          description: favoriteResult.message,
        });
        */
      }
        

      break;
      /*
    case "copy":
      const copiedTask: Task = {
        ...selectedTask,
        taskId: `task-${generateRandomThreeDigitNumber()}`,
        title: `${selectedTask.title} (copy)`,
        createdAt: new Date(),
      };
      const addCopiedTask = [...tasks, copiedTask];
      const result = await updateTasks(addCopiedTask, "copy");
      toast({
        variant: result.success ? "default" : "destructive",
        title: result.success ? "Copy Successful!" : "Copy Failed!",
        description: result.message,
      });

      break;

    case "delete":
      const deleteTasksArray = tasks.filter(
        (task) => task.taskId !== selectedTask.taskId
      );
      const deleteResult = await updateTasks(deleteTasksArray, "delete");
      toast({
        variant: deleteResult.success ? "default" : "destructive",
        title: deleteResult.success
          ? "Deletion Successful!"
          : "Deletion Failed!",
        description: deleteResult.message,
      });
      
      break;
      */

    default:
      break;
  }
}
