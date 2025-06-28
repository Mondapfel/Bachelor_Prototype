import { type Task } from "@/data/TasksData";
import { type FilterFn } from "@tanstack/react-table";

export const titleFilter: FilterFn<Task> = (row, _, filterValue) => {
    const title: string = row.getValue("title") || "";
    const query = String(filterValue).toLowerCase();
    return title.toLowerCase().includes(query);
};