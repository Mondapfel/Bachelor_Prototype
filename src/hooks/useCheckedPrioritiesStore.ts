import { create } from "zustand";
import { type Priority } from "@/data/TasksData";

interface useCheckedPrioritiesStoreInterface {
    checkedPriorities: Priority[];
    setCheckedPriorities: (priorities: Priority[]) => void;
}

export const useCheckedPrioritiesStore =
create<useCheckedPrioritiesStoreInterface>((set) => ({
    checkedPriorities:[],
    setCheckedPriorities: (prioritiesProps) => {
        set({checkedPriorities: prioritiesProps})
    },
}));