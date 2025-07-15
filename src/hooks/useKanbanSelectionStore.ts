import { create } from "zustand";

interface KanbanSelectionStore {
  selectedTaskId: string | null;
  setSelectedTaskId: (taskId: string | null) => void;
}

export const useKanbanSelectionStore = create<KanbanSelectionStore>((set) => ({
  selectedTaskId: null,
  setSelectedTaskId: (taskId) => set({ selectedTaskId: taskId }),
}));