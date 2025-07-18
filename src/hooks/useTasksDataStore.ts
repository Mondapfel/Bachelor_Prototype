import { create } from "zustand";
import { type Task, tasks } from "../data/TasksData";

export interface useTasksDataStoreInterface {
  tasks: Task[] | null;
  selectedTask: Task | null;
  // NEW: Add lastCreatedTask to the store's state
  lastCreatedTask: Task | null; 
  setSelectedTask: (task: Task | null) => void;
  setTasks: (tasks: Task[]) => void;
  fetchTasks: () => Promise<void>;
  updateTasks: (
    tasks: Task[],
    operation?: string | undefined
  ) => Promise<{ success: boolean; message: string }>;
  addTask: (task: Task) => Promise<{ success: boolean; message: string }>;
}

export const useTasksDataStore = create<useTasksDataStoreInterface>((set) => ({
  // States
  tasks: null,
  selectedTask: null,
  // NEW: Initialize lastCreatedTask as null
  lastCreatedTask: null,

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
    let successMessage = "";
    switch (operation) {
      case "copy":
        successMessage = "Die Aufgabe wurde erfolgreich dupliziert.";
        break;
      case "delete":
        successMessage = "Die Aufgabe wurde erfolgreich gelöscht.";
        break;
      case "favorite":
        successMessage = "Die Aufgabe wurde erfolgreich favorisiert.";
        break;
      default:
        successMessage = "Operation erfolgreich.";
        break;
    }
    try {
      const result = await new Promise<{ success: boolean; message: string }>(
        (resolve) => {
          setTimeout(() => {
            set({ tasks: updatedTasksArray });
            resolve({
              success: true,
              message: successMessage,
            });
          }, 1233);
        }
      );
      return result;
    } catch (error: unknown) {
      console.log(error);
      return { success: false, message: "Etwas ist schiefgelaufen!" };
    }
  },

  addTask: async (task: Task) => {
    try {
      const result = await new Promise<{ success: boolean; message: string }>(
        (resolve) => {
          setTimeout(() => {
            set((state) => {
              const updatedTasks = state.tasks
                ? [...state.tasks, task]
                : [task];
              // NEW: When a task is added, update lastCreatedTask
              return { tasks: updatedTasks, lastCreatedTask: task };
            });
            resolve({
              success: true,
              message: "Aufgabe erfolgreich hinzugefügt!",
            });
          }, 1000);
        }
      );
      return result;
    } catch (error) {
      console.log(error);
      return { success: false, message: "Aufgabe hinzufügen fehlgeschlagen!" };
    }
  },
}));
