import { create } from "zustand";
import { type Task, tasks as initialTasks } from "../data/TasksData";

// Define a key for localStorage
const TASKS_STORAGE_KEY = "tasky-tasks";

// Helper function to save tasks to localStorage
const saveTasksToStorage = (tasks: Task[]) => {
  try {
    // Convert date objects to ISO strings for reliable storage
    const storableTasks = tasks.map(task => ({
        ...task,
        dueDate: task.dueDate?.toISOString(),
        createdAt: task.createdAt.toISOString(),
    }));
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(storableTasks));
  } catch (error) {
    console.error("Failed to save tasks to localStorage:", error);
  }
};

// Helper function to load tasks from localStorage
const loadTasksFromStorage = (): Task[] | null => {
  try {
    const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    if (storedTasks) {
      // Important: Parse ISO strings back into Date objects
      const parsedTasks = JSON.parse(storedTasks);
      return parsedTasks.map((task: any) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        createdAt: new Date(task.createdAt),
      }));
    }
    return null;
  } catch (error) {
    console.error("Failed to load tasks from localStorage:", error);
    return null;
  }
};


export interface useTasksDataStoreInterface {
  tasks: Task[] | null;
  selectedTask: Task | null;
  lastCreatedTask: Task | null;
  lastModifiedTaskId: string | null;
  setSelectedTask: (task: Task | null) => void;
  setTasks: (tasks: Task[]) => void;
  fetchTasks: () => void;
  resetTasks: () => void; // Add the new reset function to the interface
  updateTasks: (
    tasks: Task[],
    operation?: string | undefined
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
    saveTasksToStorage(tasksProp);
  },

  setSelectedTask: (task) => {
    set({ selectedTask: task });
  },

  fetchTasks: () => {
    const storedTasks = loadTasksFromStorage();
    if (storedTasks) {
      set({ tasks: storedTasks });
    } else {
      set({ tasks: initialTasks });
      saveTasksToStorage(initialTasks);
    }
  },

  // --- NEW: Action to reset tasks ---
  resetTasks: () => {
    try {
      console.log("Resetting tasks to initial state.");
      localStorage.removeItem(TASKS_STORAGE_KEY); // 1. Clear storage
      set({ tasks: initialTasks, lastModifiedTaskId: `reset-${Date.now()}` }); // 2. Reset state in the app
      saveTasksToStorage(initialTasks); // 3. Save the fresh state back to storage
    } catch (error) {
      console.error("Failed to reset tasks:", error);
    }
  },

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
    set({ tasks: updatedTasksArray });
    saveTasksToStorage(updatedTasksArray);
    return { success: true, message: successMessage };
  },

  addTask: async (task: Task) => {
    const currentTasks = get().tasks ?? [];
    const updatedTasks = [...currentTasks, task];
    set({
      tasks: updatedTasks,
      lastCreatedTask: task,
      lastModifiedTaskId: task.taskId,
    });
    saveTasksToStorage(updatedTasks);
    return {
      success: true,
      message: "Aufgabe erfolgreich hinzugefügt!",
    };
  },

  updateSingleTask: async (taskId: string, updates: Partial<Task>) => {
    const currentTasks = get().tasks ?? [];
    const updatedTasks = currentTasks.map((task) =>
      task.taskId === taskId ? { ...task, ...updates } : task
    );
    set({
      tasks: updatedTasks,
      lastModifiedTaskId: taskId,
    });
    saveTasksToStorage(updatedTasks);
    return {
      success: true,
      message: "Aufgabe erfolgreich aktualisiert!",
    };
  },
}));
