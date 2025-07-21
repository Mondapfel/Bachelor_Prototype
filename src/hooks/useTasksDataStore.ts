import { create } from "zustand";
import { type Task, tasks as initialTasks } from "../data/TasksData";

export interface useTasksDataStoreInterface {
  tasks: Task[] | null;
  selectedTask: Task | null;
  lastCreatedTask: Task | null;
  lastModifiedTaskId: string | null;
  setSelectedTask: (task: Task | null) => void;
  setTasks: (tasks: Task[]) => void;
  fetchTasks: () => Promise<void>;
  updateTasks: (
    tasks: Task[],
    operation?: string | undefined,
    modifiedTaskId?: string
  ) => Promise<{ success: boolean; message: string }>;
  addTask: (task: Task) => Promise<{ success: boolean; message: string }>;
  updateSingleTask: (
    taskId: string,
    updates: Partial<Task>
  ) => Promise<{ success: boolean; message: string }>;
}

export const useTasksDataStore = create<useTasksDataStoreInterface>((set, get) => ({
  // --- STATES ---
  tasks: null,
  selectedTask: null,
  lastCreatedTask: null,
  lastModifiedTaskId: null,

  // --- ACTIONS ---
  setTasks: (tasksProp) => {
    set({ tasks: tasksProp });
  },

  setSelectedTask: (task) => {
    set({ selectedTask: task });
  },

  fetchTasks: async () => {
    try {
      console.log("Fetched initial data");
      // Simulate network delay
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          set({ tasks: initialTasks });
          resolve();
        }, 1000);
      });
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      set({ tasks: null });
    }
  },

  /**
   * Updates the entire task array. Useful for drag-and-drop or multi-delete.
   */
  updateTasks: async (
    updatedTasksArray: Task[],
    operation?: string,
  ) => {
    let successMessage = "";
    switch (operation) {
      case "copy":
        successMessage = "Die Aufgabe wurde erfolgreich dupliziert.";
        break;
      case "delete":
        successMessage = "Die Aufgaben wurden erfolgreich gelöscht.";
        break;
      case "favorite":
        successMessage = "Die Aufgabe wurde erfolgreich favorisiert.";
        break;
      default:
        successMessage = "Die Aufgaben wurden erfolgreich aktualisiert.";
        break;
    }
    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      set({ tasks: updatedTasksArray });
      return { success: true, message: successMessage };
    } catch (error: unknown) {
      console.log(error);
      return { success: false, message: "Etwas ist schiefgelaufen!" };
    }
  },

  /**
   * Adds a single new task to the array.
   */
  addTask: async (task: Task) => {
    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      set((state) => {
        const updatedTasks = state.tasks ? [...state.tasks, task] : [task];
        return {
          tasks: updatedTasks,
          lastCreatedTask: task, // Keep this for now
          lastModifiedTaskId: task.taskId, // Set the ID of the new task
        };
      });
      return {
        success: true,
        message: "Aufgabe erfolgreich hinzugefügt!",
      };
    } catch (error) {
      console.log(error);
      return { success: false, message: "Aufgabe hinzufügen fehlgeschlagen!" };
    }
  },

  updateSingleTask: async (taskId: string, updates: Partial<Task>) => {
    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      const currentTasks = get().tasks;
      if (!currentTasks) {
        throw new Error("Tasks not loaded yet.");
      }
      const updatedTasks = currentTasks.map((task) =>
        task.taskId === taskId ? { ...task, ...updates } : task
      );
      set({
        tasks: updatedTasks,
        lastModifiedTaskId: taskId, // Set the ID of the updated task
      });
      return {
        success: true,
        message: "Aufgabe erfolgreich aktualisiert!",
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: "Aufgabe aktualisieren fehlgeschlagen!",
      };
    }
  },
}));
