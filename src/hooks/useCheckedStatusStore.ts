import type { Status } from "@/data/TasksData";
import { create } from "zustand";

interface useCheckedStatusStoreInterface {
    checkedStatuses: Status[];
    setCheckedStatus: (statusProp: Status[]) => void;
}

export const useCheckedStatusStore = create<useCheckedStatusStoreInterface>(
    (set) => ({
        checkedStatuses: [],
        setCheckedStatus: (statuses) => set({ checkedStatuses: statuses}),
    })
)