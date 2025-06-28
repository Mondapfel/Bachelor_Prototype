import { create } from "zustand";
import { type Task, tasks } from "../data/TasksData";

export interface useTasksDataStoreInterface {
  tasks: Task[] | null;
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  setTasks: (tasks: Task[]) => void;
  fetchTasks: () => Promise<void>;
  /*
  updateTasks: (
    tasks: Task[],
    operation?: string | undefined
  ) => Promise<{ success: boolean; message: string }>;
  addTask: (task: Task) => Promise<{ success: boolean; message: string }>;
  */
}

export const useTasksDataStore = create<useTasksDataStoreInterface>((set) => ({
  // States
  tasks: null,
  selectedTask: null,

  // Actions
  setTasks: (tasksProp) => {
    set({ tasks: tasksProp });
  },

  setSelectedTask: (task) => {
    set({ selectedTask: task });
  },

  fetchTasks: async () => {
    try {
      console.log("fetched data");

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          set({ tasks });
          resolve();
        }, 1000);
      });
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      set({ tasks: null });
    }
  },

  updateTasks: async (
    updatedTasksArray: Task[],
    operation: string | undefined
  ) => {
    // Variable to store a success message based on the operation type
    let successMessage = "";

    // Determine the success message based on the operation type
    switch (operation) {
      case "copy":
        successMessage = "Task has been copied successfully!";
        break;
      case "delete":
        successMessage = "Task has been deleted successfully!";
        break;
      case "favorite":
        successMessage = "Task is set as favorite successfully!";
        break;
      default:
        successMessage = "Operation completed successfully!";
        break;
    }

    try {
      // Simulate an asynchronous operation (e.g., API call) with a delay
      const result = await new Promise<{ success: boolean; message: string }>(
        (resolve) => {
          setTimeout(() => {
            // Update the state with the new tasks array
            set({ tasks: updatedTasksArray });

            // Resolve the Promise with a success status and message
            resolve({
              success: true,
              message: successMessage,
            });
          }, 1233); // Simulate a delay of 1233 milliseconds
        }
      );

      // Return the result of the resolved Promise
      return result;
    } catch (error: unknown) {
      console.log(error);

      // If an error occurs, return a failure status and a generic error message
      return { success: false, message: "Something went wrong!" };
    }
  },

  // New function: addTask
  addTask: async (task: Task) => {
    try {
      // Simulate an asynchronous operation (e.g., API call) with a delay
      const result = await new Promise<{ success: boolean; message: string }>(
        (resolve) => {
          setTimeout(() => {
            // Update the state by adding the new task to the tasks array
            set((state) => {
              const updatedTasks = state.tasks
                ? [...state.tasks, task]
                : [task];
              return { tasks: updatedTasks };
            });

            // Resolve the Promise with a success status and message
            resolve({
              success: true,
              message: "Task added successfully!",
            });
          }, 1000); // Simulate a delay of 1000 milliseconds
        }
      );

      return result;
    } catch (error) {
      console.log(error);

      // If an error occurs, return a failure status and a generic error message
      return { success: false, message: "Failed to add task!" };
    }
  },
}));
