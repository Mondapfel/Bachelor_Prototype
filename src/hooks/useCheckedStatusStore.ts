import type { Status } from "@/data/TasksData";
import { create } from "zustand";

interface useCheckedStatusesStoreInterface {
    checkedStatuses: Status[];
    setCheckedStatuses: (statusProp: Status[]) => void;
}

export const useCheckedStatusesStore = create<useCheckedStatusesStoreInterface>(
    (set) => ({
        checkedStatuses: [],
        setCheckedStatuses: (statuses) => set({ checkedStatuses: statuses}),
    })
)